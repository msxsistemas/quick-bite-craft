import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';
import { useQueryClient } from '@tanstack/react-query';

const KITCHEN_SOUND_KEY = 'kitchen-sound-enabled';

export const useGlobalKitchenNotification = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Load known order IDs on mount
  useEffect(() => {
    if (!restaurantId || isInitializedRef.current) return;

    const loadInitialOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']);

      if (data) {
        previousOrderIdsRef.current = new Set(data.map(o => o.id));
      }
      isInitializedRef.current = true;
    };

    loadInitialOrders();
  }, [restaurantId]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    const soundEnabled = localStorage.getItem(KITCHEN_SOUND_KEY) !== 'false';
    if (!soundEnabled) return;

    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (error) {
      console.log('Error creating audio:', error);
    }
  }, []);

  // Real-time subscription for new orders
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`global-kitchen-notifications-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('🔔 Global notification - New order received:', payload);
          const newOrder = payload.new as { id: string; order_number: number; customer_name: string };

          // Check if this is a genuinely new order
          if (!previousOrderIdsRef.current.has(newOrder.id)) {
            playNotificationSound();
            toast.success(`🍳 Novo pedido #${newOrder.order_number} - ${newOrder.customer_name}!`);
            previousOrderIdsRef.current.add(newOrder.id);
          }

          // Invalidate queries to refresh data across pages
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe((status) => {
        console.log('🔔 Global kitchen notification subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, playNotificationSound]);
};

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from '@/components/ui/app-toast';
import { Order, OrderItem, OrderStatus } from './useOrders';

export const useKitchenOrders = (
  restaurantId: string | undefined,
  soundEnabled: boolean
) => {
  const queryClient = useQueryClient();
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  const query = useQuery({
    queryKey: ['kitchen-orders', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        items: d.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!restaurantId,
  });

  // Update previous order IDs after initial load
  useEffect(() => {
    if (query.data && isInitialLoadRef.current) {
      previousOrderIdsRef.current = new Set(query.data.map(o => o.id));
      isInitialLoadRef.current = false;
    }
  }, [query.data]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
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
  }, [soundEnabled]);

  // Real-time subscription - only handles data refresh, notifications are handled by useGlobalKitchenNotification
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`kitchen-orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('New order received in kitchen:', payload);
          const newOrder = payload.new as Order;
          
          // Only update the set and refresh data - notifications handled globally
          if (!previousOrderIdsRef.current.has(newOrder.id)) {
            previousOrderIdsRef.current.add(newOrder.id);
          }
          
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders', restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order updated in kitchen:', payload);
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders', restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order deleted:', payload);
          previousOrderIdsRef.current.delete((payload.old as Order).id);
          queryClient.invalidateQueries({ queryKey: ['kitchen-orders', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient, playNotificationSound]);

  return query;
};

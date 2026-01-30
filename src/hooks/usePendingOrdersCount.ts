import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const usePendingOrdersCount = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  // Real-time subscription for orders
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`pending-orders-count-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['pending-orders-count', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ['pending-orders-count', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return { pending: 0, preparing: 0 };

      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'pending');

      const { count: preparingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .in('status', ['accepted', 'preparing']);

      return {
        pending: pendingCount || 0,
        preparing: preparingCount || 0,
      };
    },
    enabled: !!restaurantId,
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });
};

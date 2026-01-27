import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useWaiterStats = (waiterId: string | undefined, restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  // Real-time subscription for waiter stats (orders updates)
  useEffect(() => {
    if (!waiterId || !restaurantId) return;

    const channel = supabase
      .channel(`waiter-stats-${waiterId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `waiter_id=eq.${waiterId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['waiter-stats', waiterId, restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [waiterId, restaurantId, queryClient]);

  return useQuery({
    queryKey: ['waiter-stats', waiterId, restaurantId],
    queryFn: async () => {
      if (!waiterId || !restaurantId) return { totalOrders: 0 };
      
      // Count all delivered orders for this waiter
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('waiter_id', waiterId)
        .eq('status', 'delivered');

      if (error) throw error;
      
      return {
        totalOrders: count || 0,
      };
    },
    enabled: !!waiterId && !!restaurantId,
  });
};

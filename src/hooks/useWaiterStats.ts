import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useWaiterStats = (waiterId: string | undefined, restaurantId: string | undefined) => {
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

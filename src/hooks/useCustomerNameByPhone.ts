import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCustomerNameByPhone = (restaurantId: string | undefined, phone: string | undefined) => {
  return useQuery({
    queryKey: ['customer-name', restaurantId, phone],
    queryFn: async () => {
      if (!restaurantId || !phone) return null;
      
      // Try to find the most recent order from this customer
      const { data, error } = await supabase
        .from('orders')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) return null;
      return data.customer_name;
    },
    enabled: !!restaurantId && !!phone && phone.length >= 10,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

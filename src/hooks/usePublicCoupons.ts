import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicCoupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
}

export const usePublicCoupons = (restaurantId: string | undefined) => {
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ['public-coupons', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('coupons')
        .select('id, code, discount_type, discount_value, min_order_value')
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .eq('visible', true)
        .order('discount_value', { ascending: false });
      
      if (error) throw error;
      return data as PublicCoupon[];
    },
    enabled: !!restaurantId,
  });

  // Calculate max discount for banner
  const maxDiscount = coupons.reduce((max, coupon) => {
    if (coupon.discount_type === 'fixed') {
      return Math.max(max, coupon.discount_value);
    }
    return max;
  }, 0);

  const maxPercentDiscount = coupons.reduce((max, coupon) => {
    if (coupon.discount_type === 'percent') {
      return Math.max(max, coupon.discount_value);
    }
    return 0;
  }, 0);

  return {
    coupons,
    isLoading,
    maxDiscount,
    maxPercentDiscount,
    hasCoupons: coupons.length > 0,
  };
};

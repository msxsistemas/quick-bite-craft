import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicCoupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
}

export const usePublicCoupons = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

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

  // Real-time subscription for public coupons
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`public-coupons-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coupons',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-coupons', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

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

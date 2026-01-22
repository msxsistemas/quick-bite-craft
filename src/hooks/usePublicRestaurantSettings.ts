import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicRestaurantSettings {
  id: string;
  restaurant_id: string;
  pix_key_type: string | null;
  pix_key: string | null;
  app_name: string | null;
  short_name: string | null;
  min_delivery_time: number;
  max_delivery_time: number;
  loyalty_enabled: boolean;
  loyalty_points_per_real: number;
  loyalty_min_order_for_points: number;
}

export const usePublicRestaurantSettings = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  // Real-time subscription for restaurant settings
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`public-restaurant-settings-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-restaurant-settings', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ['public-restaurant-settings', restaurantId],
    queryFn: async (): Promise<PublicRestaurantSettings | null> => {
      if (!restaurantId) return null;

      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('id, restaurant_id, pix_key_type, pix_key, app_name, short_name, min_delivery_time, max_delivery_time, loyalty_enabled, loyalty_points_per_real, loyalty_min_order_for_points')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant settings:', error);
        return null;
      }

      return data as PublicRestaurantSettings | null;
    },
    enabled: !!restaurantId,
  });
};

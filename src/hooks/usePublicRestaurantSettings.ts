import { useQuery } from '@tanstack/react-query';
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
}

export const usePublicRestaurantSettings = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['public-restaurant-settings', restaurantId],
    queryFn: async (): Promise<PublicRestaurantSettings | null> => {
      if (!restaurantId) return null;

      const { data, error } = await supabase
        .from('restaurant_settings')
        .select('id, restaurant_id, pix_key_type, pix_key, app_name, short_name, min_delivery_time, max_delivery_time')
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

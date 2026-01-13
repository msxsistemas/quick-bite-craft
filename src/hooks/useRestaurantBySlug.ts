import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  delivery_fee: number | null;
  delivery_time: string | null;
  is_open: boolean | null;
  reseller_id: string;
}

export const useRestaurantBySlug = (slug: string | undefined) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRestaurant = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle(); // Use maybeSingle instead of single to avoid 406 error

      if (fetchError) {
        throw fetchError;
      }
      
      if (data) {
        setRestaurant(data);
      } else {
        // No restaurant found - this is normal when there's no data yet
        setRestaurant(null);
        setError('Restaurante não encontrado');
      }
    } catch (err: any) {
      console.error('Error fetching restaurant:', err);
      setError('Erro ao carregar restaurante');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  return { restaurant, isLoading, error, refetch: fetchRestaurant };
};

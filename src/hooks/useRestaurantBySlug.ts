import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchRestaurant = async () => {
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
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Restaurante não encontrado');
          } else {
            throw fetchError;
          }
        } else {
          setRestaurant(data);
        }
      } catch (err: any) {
        console.error('Error fetching restaurant:', err);
        setError('Erro ao carregar restaurante');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [slug]);

  return { restaurant, isLoading, error };
};

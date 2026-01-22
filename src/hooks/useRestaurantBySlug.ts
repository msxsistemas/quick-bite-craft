import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

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
  is_manual_mode: boolean | null;
  reseller_id: string;
}

export const useRestaurantBySlug = (slug: string | undefined) => {
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to be ready before querying
  useEffect(() => {
    const checkAuth = async () => {
      await supabase.auth.getSession();
      setAuthReady(true);
    };
    checkAuth();
  }, []);

  const query = useQuery({
    queryKey: ['restaurant-by-slug', slug, authReady],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        console.error('Error fetching restaurant:', error);
        throw error;
      }
      
      return data as Restaurant | null;
    },
    enabled: !!slug && slug.length > 0 && authReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { 
    restaurant: query.data ?? null, 
    isLoading: !authReady || query.isLoading, 
    error: query.error ? 'Erro ao carregar restaurante' : null, 
    refetch: query.refetch 
  };
};

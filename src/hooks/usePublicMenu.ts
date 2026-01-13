import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  extra_groups: string[];
}

export interface PublicCategory {
  id: string;
  name: string;
  emoji: string;
  image_url: string | null;
  sort_order: number;
}

export interface PublicRestaurant {
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
}

export const usePublicMenu = (slug: string | undefined) => {
  const [restaurant, setRestaurant] = useState<PublicRestaurant | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', slug)
          .eq('is_open', true)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          setError('Restaurante não encontrado ou fechado');
          setIsLoading(false);
          return;
        }

        setRestaurant(restaurantData);

        // Fetch categories for this restaurant
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch products for this restaurant
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('active', true)
          .eq('visible', true)
          .order('sort_order', { ascending: true });

        if (productsError) throw productsError;
        
        const transformedProducts = (productsData || []).map(p => ({
          ...p,
          extra_groups: p.extra_groups || [],
        }));
        
        setProducts(transformedProducts);
      } catch (err: any) {
        console.error('Error fetching menu:', err);
        setError('Erro ao carregar cardápio');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenu();
  }, [slug]);

  return { restaurant, categories, products, isLoading, error };
};

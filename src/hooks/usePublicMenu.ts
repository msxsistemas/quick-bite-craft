import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicExtraOption {
  id: string;
  name: string;
  price: number;
}

export interface PublicExtraGroup {
  id: string;
  display_title: string;
  subtitle: string | null;
  required: boolean;
  max_selections: number;
  allow_repeat: boolean;
  options: PublicExtraOption[];
}

export interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  extra_groups: string[];
  sold_out?: boolean;
  is_promo?: boolean;
  promo_price?: number | null;
  promo_expires_at?: string | null;
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
  const [extraGroups, setExtraGroups] = useState<PublicExtraGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch restaurant (without is_open filter - we'll show closed restaurants too)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (restaurantError) throw restaurantError;

      if (!restaurantData) {
        setError('Restaurante não encontrado');
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

      // Fetch extra groups with options for this restaurant
      const { data: extraGroupsData, error: extraGroupsError } = await supabase
        .from('extra_groups')
        .select('id, display_title, subtitle, required, max_selections, allow_repeat')
        .eq('restaurant_id', restaurantData.id)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (extraGroupsError) throw extraGroupsError;

      // Fetch all options for these groups
      if (extraGroupsData && extraGroupsData.length > 0) {
        const groupIds = extraGroupsData.map(g => g.id);
        const { data: optionsData, error: optionsError } = await supabase
          .from('extra_options')
          .select('id, name, price, group_id')
          .in('group_id', groupIds)
          .eq('active', true)
          .order('sort_order', { ascending: true });

        if (optionsError) throw optionsError;

        // Map options to their groups
        const groupsWithOptions = extraGroupsData.map(group => ({
          ...group,
          allow_repeat: group.allow_repeat ?? false,
          options: (optionsData || [])
            .filter(opt => opt.group_id === group.id)
            .map(opt => ({ id: opt.id, name: opt.name, price: opt.price })),
        }));

        setExtraGroups(groupsWithOptions);
      } else {
        setExtraGroups([]);
      }
    } catch (err: any) {
      console.error('Error fetching menu:', err);
      setError('Erro ao carregar cardápio');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMenu();
  }, [fetchMenu]);

  // Real-time subscriptions for public menu
  useEffect(() => {
    if (!restaurant?.id) return;

    const restaurantId = restaurant.id;

    const channel = supabase
      .channel(`public-menu-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setRestaurant(payload.new as PublicRestaurant);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extra_groups',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchMenu();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extra_options',
        },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurant?.id, fetchMenu]);

  return { restaurant, categories, products, extraGroups, isLoading, error, refetch: fetchMenu };
};

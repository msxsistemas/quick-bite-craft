import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerLoyalty {
  id: string;
  restaurant_id: string;
  customer_phone: string;
  customer_name: string | null;
  total_points: number;
  lifetime_points: number;
  created_at: string;
  updated_at: string;
}

export interface PointsTransaction {
  id: string;
  loyalty_id: string;
  order_id: string | null;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  description: string | null;
  created_at: string;
}

export interface LoyaltyReward {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  points_required: number;
  discount_type: 'fixed' | 'percent';
  discount_value: number;
  min_order_value: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCustomerLoyalty = (restaurantId: string | undefined, phone: string) => {
  const cleanPhone = phone.replace(/\D/g, '');

  return useQuery({
    queryKey: ['customer-loyalty', restaurantId, cleanPhone],
    queryFn: async (): Promise<CustomerLoyalty | null> => {
      if (!restaurantId || cleanPhone.length < 10) return null;

      const { data, error } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer loyalty:', error);
        return null;
      }

      return data as CustomerLoyalty | null;
    },
    enabled: !!restaurantId && cleanPhone.length >= 10,
  });
};

export const usePointsTransactions = (loyaltyId: string | undefined) => {
  return useQuery({
    queryKey: ['points-transactions', loyaltyId],
    queryFn: async (): Promise<PointsTransaction[]> => {
      if (!loyaltyId) return [];

      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('loyalty_id', loyaltyId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching points transactions:', error);
        return [];
      }

      return data as PointsTransaction[];
    },
    enabled: !!loyaltyId,
  });
};

export const useLoyaltyRewards = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['loyalty-rewards', restaurantId],
    queryFn: async (): Promise<LoyaltyReward[]> => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .order('points_required', { ascending: true });

      if (error) {
        console.error('Error fetching loyalty rewards:', error);
        return [];
      }

      return data as LoyaltyReward[];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription for loyalty rewards
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`loyalty-rewards-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loyalty_rewards',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['all-loyalty-rewards', restaurantId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_loyalty',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['customer-loyalty', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
};

export const useAddLoyaltyPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      customerPhone,
      customerName,
      orderId,
      orderTotal,
    }: {
      restaurantId: string;
      customerPhone: string;
      customerName: string;
      orderId: string;
      orderTotal: number;
    }) => {
      const { data, error } = await supabase.rpc('add_loyalty_points', {
        p_restaurant_id: restaurantId,
        p_customer_phone: customerPhone,
        p_customer_name: customerName,
        p_order_id: orderId,
        p_order_total: orderTotal,
      });

      if (error) throw error;
      return data as number;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-loyalty', variables.restaurantId],
      });
    },
  });
};

export const useRedeemPoints = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      restaurantId,
      customerPhone,
      rewardId,
      orderId,
    }: {
      restaurantId: string;
      customerPhone: string;
      rewardId: string;
      orderId?: string;
    }) => {
      const { data, error } = await supabase.rpc('redeem_loyalty_points', {
        p_restaurant_id: restaurantId,
        p_customer_phone: customerPhone,
        p_reward_id: rewardId,
        p_order_id: orderId || null,
      });

      if (error) throw error;
      
      const result = data as Array<{
        success: boolean;
        message: string;
        discount_type: string | null;
        discount_value: number | null;
      }>;
      
      return result[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['customer-loyalty', variables.restaurantId],
      });
    },
  });
};

// Admin hooks for managing rewards
export const useAllLoyaltyRewards = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['all-loyalty-rewards', restaurantId],
    queryFn: async (): Promise<LoyaltyReward[]> => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('loyalty_rewards')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching all loyalty rewards:', error);
        return [];
      }

      return data as LoyaltyReward[];
    },
    enabled: !!restaurantId,
  });
};

export const useCreateLoyaltyReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reward: Omit<LoyaltyReward, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .insert(reward)
        .select()
        .single();

      if (error) throw error;
      return data as LoyaltyReward;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['all-loyalty-rewards', data.restaurant_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['loyalty-rewards', data.restaurant_id],
      });
    },
  });
};

export const useUpdateLoyaltyReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoyaltyReward> & { id: string }) => {
      const { data, error } = await supabase
        .from('loyalty_rewards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as LoyaltyReward;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['all-loyalty-rewards', data.restaurant_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['loyalty-rewards', data.restaurant_id],
      });
    },
  });
};

export const useDeleteLoyaltyReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, restaurantId }: { id: string; restaurantId: string }) => {
      const { error } = await supabase
        .from('loyalty_rewards')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, restaurantId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['all-loyalty-rewards', data.restaurantId],
      });
      queryClient.invalidateQueries({
        queryKey: ['loyalty-rewards', data.restaurantId],
      });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Coupon {
  id: string;
  restaurant_id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponFormData {
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_uses: number | null;
  expires_at: string | null;
  active: boolean;
  visible: boolean;
}

export interface ValidateCouponResult {
  valid: boolean;
  coupon_id: string | null;
  discount_type: string | null;
  discount_value: number | null;
  error_message: string | null;
}

export const useCoupons = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: ['coupons', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Coupon[];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription for coupons
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`coupons-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coupons',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  const createCoupon = useMutation({
    mutationFn: async (formData: CouponFormData) => {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          restaurant_id: restaurantId,
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          min_order_value: formData.min_order_value,
          max_uses: formData.max_uses,
          expires_at: formData.expires_at,
          active: formData.active,
          visible: formData.visible,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
      toast.success('Cupom criado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Já existe um cupom com este código');
      } else {
        toast.error('Erro ao criar cupom');
      }
    },
  });

  const updateCoupon = useMutation({
    mutationFn: async ({ id, ...formData }: Partial<CouponFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update({
          ...formData,
          code: formData.code?.toUpperCase(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
      toast.success('Cupom atualizado com sucesso!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate key')) {
        toast.error('Já existe um cupom com este código');
      } else {
        toast.error('Erro ao atualizar cupom');
      }
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
      toast.success('Cupom excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir cupom');
    },
  });

  const toggleCouponVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ visible })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
    },
    onError: () => {
      toast.error('Erro ao alterar visibilidade');
    },
  });

  const toggleCouponActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', restaurantId] });
    },
    onError: () => {
      toast.error('Erro ao alterar status');
    },
  });

  return {
    coupons,
    isLoading,
    error,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponVisibility,
    toggleCouponActive,
  };
};

// Hook for validating coupons in checkout (public)
export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: async ({ 
      restaurantId, 
      code, 
      orderTotal 
    }: { 
      restaurantId: string; 
      code: string; 
      orderTotal: number;
    }): Promise<ValidateCouponResult> => {
      const { data, error } = await supabase
        .rpc('validate_coupon', {
          p_restaurant_id: restaurantId,
          p_code: code,
          p_order_total: orderTotal,
        });
      
      if (error) throw error;
      
      // RPC returns an array, get first result
      const result = data?.[0];
      if (!result) {
        return {
          valid: false,
          coupon_id: null,
          discount_type: null,
          discount_value: null,
          error_message: 'Erro ao validar cupom',
        };
      }
      
      return result as ValidateCouponResult;
    },
  });
};

// Hook for using a coupon (increment count)
export const useUseCoupon = () => {
  return useMutation({
    mutationFn: async (couponId: string) => {
      const { error } = await supabase.rpc('use_coupon', {
        p_coupon_id: couponId,
      });
      
      if (error) throw error;
    },
  });
};

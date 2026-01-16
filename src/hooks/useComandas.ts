import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Comanda {
  id: string;
  restaurant_id: string;
  number: string;
  customer_name: string | null;
  customer_phone: string | null;
  waiter_id: string | null;
  status: 'open' | 'closed';
  payment_method: string | null;
  tip_amount: number;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateComandaData {
  restaurant_id: string;
  number: string;
  customer_name?: string;
  customer_phone?: string;
  waiter_id?: string;
}

export interface CloseComandaData {
  id: string;
  payment_method: string;
  tip_amount?: number;
}

export const useComandas = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: comandas = [], isLoading, refetch } = useQuery({
    queryKey: ['comandas', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('comandas')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as Comanda[];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`comandas-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comandas',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['comandas', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  const createComanda = useMutation({
    mutationFn: async (data: CreateComandaData) => {
      const { data: result, error } = await supabase
        .from('comandas')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', restaurantId] });
    },
    onError: (error) => {
      console.error('Error creating comanda:', error);
      toast.error('Erro ao criar comanda');
    },
  });

  const updateComanda = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Comanda> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('comandas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', restaurantId] });
    },
    onError: (error) => {
      console.error('Error updating comanda:', error);
      toast.error('Erro ao atualizar comanda');
    },
  });

  const closeComanda = useMutation({
    mutationFn: async ({ id, payment_method, tip_amount = 0 }: CloseComandaData) => {
      const { data: result, error } = await supabase
        .from('comandas')
        .update({
          status: 'closed',
          payment_method,
          tip_amount,
          closed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', restaurantId] });
      toast.success('Comanda fechada com sucesso!');
    },
    onError: (error) => {
      console.error('Error closing comanda:', error);
      toast.error('Erro ao fechar comanda');
    },
  });

  const deleteComanda = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comandas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas', restaurantId] });
      toast.success('Comanda excluída!');
    },
    onError: (error) => {
      console.error('Error deleting comanda:', error);
      toast.error('Erro ao excluir comanda');
    },
  });

  // Get next comanda number
  const getNextNumber = () => {
    const openComandas = comandas.filter(c => c.status === 'open');
    const maxNumber = openComandas.reduce((max, c) => {
      const num = parseInt(c.number, 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return String(maxNumber + 1).padStart(3, '0');
  };

  return {
    comandas,
    isLoading,
    refetch,
    createComanda,
    updateComanda,
    closeComanda,
    deleteComanda,
    getNextNumber,
  };
};

// Hook to get orders for a specific comanda
export const useComandaOrders = (comandaId: string | undefined) => {
  return useQuery({
    queryKey: ['comanda-orders', comandaId],
    queryFn: async () => {
      if (!comandaId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('comanda_id', comandaId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!comandaId,
  });
};

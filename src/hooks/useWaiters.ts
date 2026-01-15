import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Waiter {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useWaiters = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: waiters = [], isLoading, refetch } = useQuery({
    queryKey: ['waiters', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];

      const { data, error } = await supabase
        .from('waiters')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Waiter[];
    },
    enabled: !!restaurantId,
  });

  const createWaiter = useMutation({
    mutationFn: async (waiter: { name: string; phone: string }) => {
      if (!restaurantId) throw new Error('Restaurant ID is required');

      const { data, error } = await supabase
        .from('waiters')
        .insert({
          restaurant_id: restaurantId,
          name: waiter.name,
          phone: waiter.phone,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
      toast.success('Garçom adicionado!');
    },
    onError: (error) => {
      console.error('Error creating waiter:', error);
      toast.error('Erro ao adicionar garçom');
    },
  });

  const updateWaiter = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Waiter> & { id: string }) => {
      const { data, error } = await supabase
        .from('waiters')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
      toast.success('Garçom atualizado!');
    },
    onError: (error) => {
      console.error('Error updating waiter:', error);
      toast.error('Erro ao atualizar garçom');
    },
  });

  const deleteWaiter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('waiters')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
      toast.success('Garçom removido!');
    },
    onError: (error) => {
      console.error('Error deleting waiter:', error);
      toast.error('Erro ao remover garçom');
    },
  });

  const toggleWaiterStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('waiters')
        .update({ active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
      toast.success('Status atualizado!');
    },
    onError: (error) => {
      console.error('Error toggling waiter status:', error);
      toast.error('Erro ao atualizar status');
    },
  });

  return {
    waiters,
    isLoading,
    refetch,
    createWaiter,
    updateWaiter,
    deleteWaiter,
    toggleWaiterStatus,
  };
};

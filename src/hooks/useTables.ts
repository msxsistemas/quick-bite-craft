import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Table {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  capacity: number;
  status: 'free' | 'occupied' | 'requesting' | 'reserved';
  current_waiter_id: string | null;
  current_order_id: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  waiter?: {
    id: string;
    name: string;
  } | null;
}

export const useTables = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('tables')
        .select(`
          *,
          waiter:waiters!tables_current_waiter_id_fkey(id, name)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as Table[];
    },
    enabled: !!restaurantId,
  });

  // Realtime subscription for tables
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`tables-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Table update:', payload);
          queryClient.invalidateQueries({ queryKey: ['tables', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  const createTable = useMutation({
    mutationFn: async (tableData: { name: string; description?: string; capacity: number }) => {
      if (!restaurantId) throw new Error('Restaurant ID is required');
      
      const { data, error } = await supabase
        .from('tables')
        .insert([{
          restaurant_id: restaurantId,
          name: tableData.name,
          description: tableData.description || null,
          capacity: tableData.capacity,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', restaurantId] });
      toast.success('Mesa criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar mesa: ' + error.message);
    },
  });

  const updateTable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Table> & { id: string }) => {
      const { data, error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', restaurantId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar mesa: ' + error.message);
    },
  });

  const updateTableStatus = useMutation({
    mutationFn: async ({ 
      tableId, 
      status, 
      waiterId, 
      orderId 
    }: { 
      tableId: string; 
      status: Table['status']; 
      waiterId?: string | null;
      orderId?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('tables')
        .update({
          status,
          current_waiter_id: waiterId,
          current_order_id: orderId,
        })
        .eq('id', tableId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', restaurantId] });
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const deleteTable = useMutation({
    mutationFn: async (tableId: string) => {
      const { error } = await supabase
        .from('tables')
        .update({ active: false })
        .eq('id', tableId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables', restaurantId] });
      toast.success('Mesa removida com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao remover mesa: ' + error.message);
    },
  });

  return {
    tables: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTable,
    updateTable,
    updateTableStatus,
    deleteTable,
    refetch: query.refetch,
  };
};

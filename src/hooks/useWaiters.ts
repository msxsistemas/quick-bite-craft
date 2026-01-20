import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';

export interface Waiter {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WaiterWithStats extends Waiter {
  ordersToday: number;
  tipsToday: number;
  totalToday: number;
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

  // Real-time subscription for waiters
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`waiters-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiters',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  // Fetch today's stats for all waiters
  const { data: waiterStats = {} } = useQuery({
    queryKey: ['waiter-stats', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return {};

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('waiter_id, tip_amount, total')
        .eq('restaurant_id', restaurantId)
        .not('waiter_id', 'is', null)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .neq('status', 'cancelled');

      if (error) throw error;

      // Aggregate stats by waiter
      const stats: Record<string, { ordersToday: number; tipsToday: number; totalToday: number }> = {};
      
      for (const order of orders || []) {
        if (!order.waiter_id) continue;
        
        if (!stats[order.waiter_id]) {
          stats[order.waiter_id] = { ordersToday: 0, tipsToday: 0, totalToday: 0 };
        }
        
        stats[order.waiter_id].ordersToday += 1;
        stats[order.waiter_id].tipsToday += Number(order.tip_amount) || 0;
        stats[order.waiter_id].totalToday += Number(order.total) || 0;
      }

      return stats;
    },
    enabled: !!restaurantId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Combine waiters with their stats
  const waitersWithStats: WaiterWithStats[] = waiters.map(waiter => ({
    ...waiter,
    ordersToday: waiterStats[waiter.id]?.ordersToday || 0,
    tipsToday: waiterStats[waiter.id]?.tipsToday || 0,
    totalToday: waiterStats[waiter.id]?.totalToday || 0,
  }));

  // Calculate totals
  const totalTipsToday = waitersWithStats.reduce((sum, w) => sum + w.tipsToday, 0);
  const totalRevenueToday = waitersWithStats.reduce((sum, w) => sum + w.totalToday, 0);

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
      return { ...data, active };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['waiters', restaurantId] });
      toast.success(data.active ? 'Garçom ativado!' : 'Garçom desativado!');
    },
    onError: (error) => {
      console.error('Error toggling waiter status:', error);
      toast.error('Erro ao atualizar status do garçom');
    },
  });

  return {
    waiters: waitersWithStats,
    isLoading,
    refetch,
    totalTipsToday,
    totalRevenueToday,
    createWaiter,
    updateWaiter,
    deleteWaiter,
    toggleWaiterStatus,
  };
};

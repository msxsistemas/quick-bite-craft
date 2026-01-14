import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OperatingHour {
  id: string;
  restaurant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OperatingHourFormData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  active?: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const getDayName = (dayOfWeek: number): string => {
  return DAY_NAMES[dayOfWeek] || '';
};

export const useOperatingHours = (restaurantId: string | undefined) => {
  const [hours, setHours] = useState<OperatingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const togglingIdsRef = useRef<Set<string>>(new Set());

  const fetchHours = useCallback(async () => {
    if (!restaurantId) {
      setHours([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setHours(data || []);
    } catch (error) {
      console.error('Error fetching operating hours:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`operating_hours_${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operating_hours',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchHours();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchHours]);

  const createHour = async (formData: OperatingHourFormData) => {
    if (!restaurantId) return;

    try {
      const { error } = await supabase
        .from('operating_hours')
        .insert({
          restaurant_id: restaurantId,
          day_of_week: formData.day_of_week,
          start_time: formData.start_time,
          end_time: formData.end_time,
          active: formData.active ?? true,
        });

      if (error) throw error;
      toast.success('Horário adicionado com sucesso!');
    } catch (error: any) {
      console.error('Error creating operating hour:', error);
      toast.error('Erro ao adicionar horário');
    }
  };

  const updateHour = async (id: string, formData: Partial<OperatingHourFormData>) => {
    try {
      const { error } = await supabase
        .from('operating_hours')
        .update({
          ...formData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Horário atualizado!');
    } catch (error: any) {
      console.error('Error updating operating hour:', error);
      toast.error('Erro ao atualizar horário');
    }
  };

  const deleteHour = async (id: string) => {
    try {
      const { error } = await supabase
        .from('operating_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Horário excluído!');
    } catch (error: any) {
      console.error('Error deleting operating hour:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  const toggleActive = async (id: string) => {
    // Prevent multiple rapid clicks
    if (togglingIdsRef.current.has(id)) return;
    
    const hour = hours.find(h => h.id === id);
    if (!hour) return;

    togglingIdsRef.current.add(id);
    try {
      const { error } = await supabase
        .from('operating_hours')
        .update({ active: !hour.active, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error toggling operating hour:', error);
      toast.error('Erro ao atualizar horário');
    }
  };

  // Initialize default hours for all days if none exist
  const initializeDefaultHours = async () => {
    if (!restaurantId || hours.length > 0) return;

    try {
      const defaultHours = DAY_NAMES.map((_, index) => ({
        restaurant_id: restaurantId,
        day_of_week: index,
        start_time: '09:00',
        end_time: '22:00',
        active: index !== 0, // Sunday closed by default
      }));

      const { error } = await supabase
        .from('operating_hours')
        .insert(defaultHours);

      if (error) throw error;
      toast.success('Horários padrão criados!');
    } catch (error: any) {
      console.error('Error initializing default hours:', error);
    }
  };

  return {
    hours,
    isLoading,
    createHour,
    updateHour,
    deleteHour,
    toggleActive,
    initializeDefaultHours,
    refetch: fetchHours,
  };
};

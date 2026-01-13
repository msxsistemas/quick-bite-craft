import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RestaurantSettings {
  id: string;
  restaurant_id: string;
  charge_mode: 'fixed' | 'zone';
  fixed_delivery_fee: number;
  min_delivery_time: number;
  max_delivery_time: number;
  pix_key_type: string | null;
  pix_key: string | null;
  app_name: string | null;
  short_name: string | null;
  whatsapp_msg_pix: string | null;
  whatsapp_msg_accepted: string | null;
  whatsapp_msg_delivery: string | null;
  whatsapp_msg_delivered: string | null;
  loyalty_enabled: boolean;
  loyalty_points_per_real: number;
  loyalty_min_order_for_points: number;
  created_at: string;
  updated_at: string;
}

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

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const useRestaurantSettings = (restaurantId: string | undefined) => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // If no settings exist, create default settings
      if (!settingsData) {
        const { data: newSettings, error: createError } = await supabase
          .from('restaurant_settings')
          .insert({
            restaurant_id: restaurantId,
          })
          .select()
          .single();

        if (createError) throw createError;
        setSettings(newSettings as RestaurantSettings);
      } else {
        setSettings(settingsData as RestaurantSettings);
      }

      // Fetch operating hours
      const { data: hoursData, error: hoursError } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('day_of_week');

      if (hoursError) throw hoursError;

      // If no hours exist, create default hours
      if (!hoursData || hoursData.length === 0) {
        const defaultHours = DAY_NAMES.map((_, index) => ({
          restaurant_id: restaurantId,
          day_of_week: index,
          start_time: '11:00',
          end_time: '23:00',
          active: index !== 0, // Closed on Sundays by default
        }));

        const { data: newHours, error: createHoursError } = await supabase
          .from('operating_hours')
          .insert(defaultHours)
          .select();

        if (createHoursError) throw createHoursError;
        setOperatingHours(newHours as OperatingHour[]);
      } else {
        setOperatingHours(hoursData as OperatingHour[]);
      }
    } catch (error) {
      console.error('Error fetching restaurant settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Real-time subscription for restaurant settings
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`restaurant-settings-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_settings',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setSettings(payload.new as RestaurantSettings);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operating_hours',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          // Refetch operating hours
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchSettings]);

  const updateSettings = async (updates: Partial<RestaurantSettings>) => {
    if (!settings) return;

    try {
      const { data, error } = await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;

      setSettings(data as RestaurantSettings);
      toast.success('Configurações salvas!');
      return data;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configurações');
      throw error;
    }
  };

  const updateOperatingHour = async (id: string, updates: Partial<OperatingHour>) => {
    try {
      const { data, error } = await supabase
        .from('operating_hours')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setOperatingHours(prev => prev.map(h => h.id === id ? data as OperatingHour : h));
      return data;
    } catch (error) {
      console.error('Error updating operating hour:', error);
      toast.error('Erro ao atualizar horário');
      throw error;
    }
  };

  const toggleDayActive = async (id: string) => {
    const hour = operatingHours.find(h => h.id === id);
    if (!hour) return;

    await updateOperatingHour(id, { active: !hour.active });
  };

  return {
    settings,
    operatingHours,
    isLoading,
    updateSettings,
    updateOperatingHour,
    toggleDayActive,
    refetch: fetchSettings,
  };
};

export const getDayName = (dayOfWeek: number) => DAY_NAMES[dayOfWeek];

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OperatingHour {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

/**
 * Verifica se o horário atual está dentro do período de funcionamento
 */
export const isWithinOperatingHours = (hours: OperatingHour[]): boolean => {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
  const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

  // Encontrar horário do dia atual
  const todayHour = hours.find((h) => h.day_of_week === currentDay && h.active);

  if (!todayHour) {
    return false; // Dia não configurado ou inativo
  }

  const start = todayHour.start_time.slice(0, 5);
  const end = todayHour.end_time.slice(0, 5);

  // Comparação simples de strings funciona para formato HH:MM
  return currentTime >= start && currentTime <= end;
};

/**
 * Hook que sincroniza o status is_open do restaurante com os horários de funcionamento
 */
export const useStoreOpenSync = (
  restaurantId: string | undefined,
  isManualMode: boolean,
  onStatusChange?: (isOpen: boolean) => void
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncStatus = useCallback(async () => {
    if (!restaurantId || isManualMode) return;

    try {
      // Buscar horários de funcionamento
      const { data: hours, error: hoursError } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('restaurant_id', restaurantId);

      if (hoursError) throw hoursError;

      if (!hours || hours.length === 0) {
        return; // Sem horários configurados, não sincroniza
      }

      const shouldBeOpen = isWithinOperatingHours(hours);

      // Buscar status atual
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('is_open')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;

      // Atualizar apenas se diferente
      if (restaurant.is_open !== shouldBeOpen) {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ is_open: shouldBeOpen })
          .eq('id', restaurantId);

        if (updateError) throw updateError;

        onStatusChange?.(shouldBeOpen);
      }
    } catch (error) {
      console.error('Error syncing store status:', error);
    }
  }, [restaurantId, isManualMode, onStatusChange]);

  // Sincroniza imediatamente ao montar e a cada minuto
  useEffect(() => {
    if (!restaurantId || isManualMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Sync imediato
    syncStatus();

    // Sync a cada 60 segundos
    intervalRef.current = setInterval(syncStatus, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [restaurantId, isManualMode, syncStatus]);

  return { syncStatus };
};

/**
 * Força a sincronização do status baseado nos horários (útil para botão manual)
 */
export const syncStoreStatusNow = async (restaurantId: string): Promise<boolean> => {
  try {
    const { data: hours, error: hoursError } = await supabase
      .from('operating_hours')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (hoursError) throw hoursError;

    if (!hours || hours.length === 0) {
      return false;
    }

    const shouldBeOpen = isWithinOperatingHours(hours);

    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ is_open: shouldBeOpen })
      .eq('id', restaurantId);

    if (updateError) throw updateError;

    return shouldBeOpen;
  } catch (error) {
    console.error('Error syncing store status:', error);
    throw error;
  }
};

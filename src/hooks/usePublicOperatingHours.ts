import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicOperatingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export const getDayName = (dayOfWeek: number): string => {
  return DAY_NAMES[dayOfWeek] || '';
};

export const usePublicOperatingHours = (restaurantId: string | undefined) => {
  const [hours, setHours] = useState<PublicOperatingHour[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHours = useCallback(async () => {
    if (!restaurantId) {
      setHours([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('operating_hours')
        .select('day_of_week, start_time, end_time, active')
        .eq('restaurant_id', restaurantId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      setHours(data || []);
    } catch (error) {
      console.error('Error fetching operating hours:', error);
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  // Initial fetch
  useEffect(() => {
    fetchHours();
  }, [fetchHours]);

  // Real-time subscription for operating hours
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`public-operating-hours-${restaurantId}`)
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

  // Find next opening time
  const getNextOpeningInfo = (): { dayName: string; time: string } | null => {
    if (hours.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check remaining hours today
    const todayHours = hours.filter(h => h.day_of_week === currentDay && h.active);
    for (const h of todayHours) {
      if (h.start_time > currentTime) {
        return { dayName: 'Hoje', time: h.start_time };
      }
    }

    // Check next 7 days
    for (let offset = 1; offset <= 7; offset++) {
      const nextDay = (currentDay + offset) % 7;
      const nextDayHours = hours.filter(h => h.day_of_week === nextDay && h.active);
      
      if (nextDayHours.length > 0) {
        // Get earliest opening time for that day
        const earliest = nextDayHours.reduce((min, h) => 
          h.start_time < min.start_time ? h : min
        );
        
        const dayLabel = offset === 1 ? 'Amanhã' : DAY_NAMES[nextDay];
        return { dayName: dayLabel, time: earliest.start_time };
      }
    }

    return null;
  };

  // Get today's hours for display
  const getTodayHours = (): PublicOperatingHour | null => {
    const today = new Date().getDay();
    return hours.find(h => h.day_of_week === today && h.active) || null;
  };

  return {
    hours,
    isLoading,
    getNextOpeningInfo,
    getTodayHours,
    getDayName,
    refetch: fetchHours,
  };
};

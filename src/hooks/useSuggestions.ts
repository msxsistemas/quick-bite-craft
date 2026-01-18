import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PeriodFilter = '7days' | '30days' | '3months';

interface SuggestionStats {
  averageRating: number;
  totalSuggestions: number;
  ratingDistribution: { rating: number; count: number }[];
  dailyAverages: { date: string; average: number; count: number }[];
}

interface Suggestion {
  id: string;
  rating: number;
  message: string | null;
  source: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  table_id: string | null;
  comanda_id: string | null;
  waiter_id: string | null;
}

export const useSuggestions = (restaurantId: string | undefined, period: PeriodFilter = '7days') => {
  const queryClient = useQueryClient();

  // Real-time subscription for suggestions
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`suggestions-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suggestions',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['suggestions', restaurantId] });
          queryClient.invalidateQueries({ queryKey: ['suggestions-list', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return useQuery({
    queryKey: ['suggestions', restaurantId, period],
    queryFn: async (): Promise<SuggestionStats> => {
      if (!restaurantId) {
        return {
          averageRating: 0,
          totalSuggestions: 0,
          ratingDistribution: [],
          dailyAverages: []
        };
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      let daysToShow = 7;
      
      switch (period) {
        case '7days':
          startDate.setDate(now.getDate() - 7);
          daysToShow = 7;
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          daysToShow = 30;
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          daysToShow = 90;
          break;
      }

      const { data, error } = await supabase
        .from('suggestions')
        .select('rating, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          averageRating: 0,
          totalSuggestions: 0,
          ratingDistribution: [],
          dailyAverages: []
        };
      }

      // Calculate average rating
      const totalRating = data.reduce((sum, s) => sum + s.rating, 0);
      const averageRating = totalRating / data.length;

      // Calculate rating distribution
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.forEach(s => {
        if (ratingCounts[s.rating] !== undefined) {
          ratingCounts[s.rating]++;
        }
      });
      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count
      }));

      // Calculate daily/weekly averages based on period
      const dailyData: Record<string, { sum: number; count: number }> = {};
      
      // Initialize all days in the period
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { sum: 0, count: 0 };
      }

      // Fill with actual data
      data.forEach(s => {
        const dateStr = new Date(s.created_at).toISOString().split('T')[0];
        if (dailyData[dateStr]) {
          dailyData[dateStr].sum += s.rating;
          dailyData[dateStr].count++;
        }
      });

      // For 30 days and 3 months, group by week
      let dailyAverages: { date: string; average: number; count: number }[];
      
      if (period === '7days') {
        dailyAverages = Object.entries(dailyData).map(([date, { sum, count }]) => ({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          average: count > 0 ? sum / count : 0,
          count
        }));
      } else {
        // Group by week for longer periods
        const weeklyData: { date: string; sum: number; count: number }[] = [];
        const entries = Object.entries(dailyData);
        const chunkSize = period === '30days' ? 5 : 7;
        
        for (let i = 0; i < entries.length; i += chunkSize) {
          const chunk = entries.slice(i, i + chunkSize);
          const weekSum = chunk.reduce((acc, [, v]) => acc + v.sum, 0);
          const weekCount = chunk.reduce((acc, [, v]) => acc + v.count, 0);
          const firstDate = new Date(chunk[0][0]);
          
          weeklyData.push({
            date: firstDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            sum: weekSum,
            count: weekCount
          });
        }
        
        dailyAverages = weeklyData.map(({ date, sum, count }) => ({
          date,
          average: count > 0 ? sum / count : 0,
          count
        }));
      }

      return {
        averageRating,
        totalSuggestions: data.length,
        ratingDistribution,
        dailyAverages
      };
    },
    enabled: !!restaurantId
  });
};

export const useSuggestionsList = (restaurantId: string | undefined, filters?: {
  rating?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
}) => {
  return useQuery({
    queryKey: ['suggestions-list', restaurantId, filters],
    queryFn: async (): Promise<Suggestion[]> => {
      if (!restaurantId) return [];

      let query = supabase
        .from('suggestions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (filters?.rating) {
        query = query.eq('rating', filters.rating);
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
    enabled: !!restaurantId
  });
};

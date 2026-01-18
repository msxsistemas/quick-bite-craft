import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SuggestionStats {
  averageRating: number;
  totalSuggestions: number;
  ratingDistribution: { rating: number; count: number }[];
  dailyAverages: { date: string; average: number; count: number }[];
}

export const useSuggestions = (restaurantId: string | undefined) => {
  return useQuery({
    queryKey: ['suggestions', restaurantId],
    queryFn: async (): Promise<SuggestionStats> => {
      if (!restaurantId) {
        return {
          averageRating: 0,
          totalSuggestions: 0,
          ratingDistribution: [],
          dailyAverages: []
        };
      }

      const { data, error } = await supabase
        .from('suggestions')
        .select('rating, created_at')
        .eq('restaurant_id', restaurantId)
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

      // Calculate daily averages (last 7 days)
      const dailyData: Record<string, { sum: number; count: number }> = {};
      const now = new Date();
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
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

      const dailyAverages = Object.entries(dailyData).map(([date, { sum, count }]) => ({
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        average: count > 0 ? sum / count : 0,
        count
      }));

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

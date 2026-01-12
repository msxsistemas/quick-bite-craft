import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface RestaurantWithSubscription {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  created_at: string;
  subscription?: {
    id: string;
    status: string;
    monthly_fee: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };
}

interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at: string | null;
  restaurant_name?: string;
}

export function useRestaurantSubscriptions() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantWithSubscription[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false });

      if (restaurantsError) throw restaurantsError;

      // Fetch subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('restaurant_subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      // Map subscriptions to restaurants
      const restaurantsWithSubs: RestaurantWithSubscription[] = (restaurantsData || []).map(r => {
        const sub = (subscriptionsData || []).find((s: any) => s.restaurant_id === r.id);
        return {
          ...r,
          subscription: sub ? {
            id: sub.id,
            status: sub.status,
            monthly_fee: Number(sub.monthly_fee),
            trial_ends_at: sub.trial_ends_at,
            current_period_end: sub.current_period_end,
          } : undefined,
        };
      });

      setRestaurants(restaurantsWithSubs);

      // Fetch payments
      const subscriptionIds = (subscriptionsData || []).map((s: any) => s.id);
      if (subscriptionIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('subscription_payments')
          .select('*')
          .in('subscription_id', subscriptionIds)
          .order('due_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        // Add restaurant names to payments
        const paymentsWithNames: SubscriptionPayment[] = (paymentsData || []).map((p: any) => {
          const sub = (subscriptionsData || []).find((s: any) => s.id === p.subscription_id);
          const restaurant = restaurantsWithSubs.find(r => r.subscription?.id === p.subscription_id);
          return {
            ...p,
            amount: Number(p.amount),
            restaurant_name: restaurant?.name || 'Restaurante',
          };
        });

        setPayments(paymentsWithNames);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getStats = () => {
    const activeSubscriptions = restaurants.filter(r => r.subscription?.status === 'active');
    const trialSubscriptions = restaurants.filter(r => r.subscription?.status === 'trial' || !r.subscription);
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    const paidPayments = payments.filter(p => p.status === 'paid');

    const monthlyRevenue = activeSubscriptions.reduce((sum, r) => sum + (r.subscription?.monthly_fee || 0), 0);
    const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalRestaurants: restaurants.length,
      activeSubscriptions: activeSubscriptions.length,
      trialSubscriptions: trialSubscriptions.length,
      monthlyRevenue,
      pendingPayments: pendingPayments.length,
      pendingAmount,
      overduePayments: overduePayments.length,
      overdueAmount,
      paidAmount,
    };
  };

  return {
    restaurants,
    payments,
    isLoading,
    refetch: fetchData,
    getStats,
  };
}

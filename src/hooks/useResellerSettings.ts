import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface ResellerSettings {
  id: string;
  reseller_id: string;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  primary_color: string;
  secondary_color: string;
  mercadopago_enabled: boolean;
  mercadopago_access_token: string | null;
  mercadopago_public_key: string | null;
}

interface SubscriptionPlan {
  id: string;
  reseller_id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

export function useResellerSettings() {
  const { user, profile } = useAuth();
  const [settings, setSettings] = useState<ResellerSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('reseller_settings')
        .select('*')
        .eq('reseller_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as ResellerSettings);
      } else {
        // Create default settings if not exists
        const newSettings = {
          reseller_id: user.id,
          full_name: profile?.name || null,
          company_name: null,
          phone: profile?.phone || null,
          primary_color: '#FF9500',
          secondary_color: '#1E57DC',
          mercadopago_enabled: false,
        };

        const { data: created, error: createError } = await supabase
          .from('reseller_settings')
          .insert(newSettings)
          .select()
          .single();

        if (createError) throw createError;
        setSettings(created as ResellerSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPlans((data || []) as SubscriptionPlan[]);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchSettings(), fetchPlans()]);
      setIsLoading(false);
    };
    loadData();
  }, [user]);

  const updateSettings = async (updates: Partial<ResellerSettings>) => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('reseller_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) throw error;

      setSettings({ ...settings, ...updates });
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const createPlan = async (plan: { name: string; description: string | null; price: number }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert({
          ...plan,
          reseller_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setPlans([...plans, data as SubscriptionPlan]);
      toast.success('Plano criado!');
      return data;
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Erro ao criar plano');
    }
  };

  const updatePlan = async (id: string, updates: Partial<SubscriptionPlan>) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Plano atualizado!');
    } catch (error) {
      console.error('Error updating plan:', error);
      toast.error('Erro ao atualizar plano');
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlans(plans.filter(p => p.id !== id));
      toast.success('Plano excluído!');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir plano');
    }
  };

  return {
    settings,
    plans,
    isLoading,
    updateSettings,
    createPlan,
    updatePlan,
    deletePlan,
    refetch: () => {
      fetchSettings();
      fetchPlans();
    },
  };
}

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { subscribeStoreStatus } from '@/lib/storeStatusEvent';
import { subscribeStoreManualMode } from '@/lib/storeStatusMode';
import { useStoreOpenSync } from '@/hooks/useStoreOpenStatus';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  const [restaurantName, setRestaurantName] = useState<string>('Restaurante');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const fetchRestaurantInfo = useCallback(async () => {
    if (type !== 'restaurant' || !restaurantSlug) return;

    const { data } = await supabase
      .from('restaurants')
      .select('id, name, is_open, is_manual_mode')
      .eq('slug', restaurantSlug)
      .maybeSingle();

    if (data) {
      setRestaurantId(data.id);
      setRestaurantName(data.name);
      setIsOpen(data.is_open ?? false);
      setIsManualMode(data.is_manual_mode ?? false);
    }
  }, [type, restaurantSlug]);

  // Busca inicial
  useEffect(() => {
    fetchRestaurantInfo();
  }, [fetchRestaurantInfo]);

  // Realtime subscription para atualizar status sem refetch
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantId) return;

    const channel = supabase
      .channel(`sidebar-restaurant-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
          filter: `id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.new) {
            setIsOpen(payload.new.is_open ?? false);
            if (payload.new.name) setRestaurantName(payload.new.name);
            if (typeof payload.new.is_manual_mode === 'boolean') {
              setIsManualMode(payload.new.is_manual_mode);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, restaurantId]);

  // Mantém o status sincronizado automaticamente com os horários (quando estiver em automático)
  useStoreOpenSync(restaurantId ?? undefined, isManualMode, (nextOpen) => {
    setIsOpen(nextOpen);
  });

  // Escuta eventos de mudança de status dentro da mesma aba
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = subscribeStoreStatus((detail) => {
      if (detail.restaurantId === restaurantId) {
        setIsOpen(detail.isOpen);
      }
    });

    return unsubscribe;
  }, [restaurantId]);

  // Escuta eventos de mudança de modo (manual/automático) dentro da mesma aba
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = subscribeStoreManualMode((detail) => {
      if (detail.restaurantId === restaurantId) {
        setIsManualMode(detail.manual);
      }
    });

    return unsubscribe;
  }, [restaurantId]);

  // Refetch quando a aba/janela ganha foco (garante sync após mudanças em outras abas)
  useEffect(() => {
    const handleFocus = () => {
      fetchRestaurantInfo();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchRestaurantInfo]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        type={type}
        restaurantSlug={restaurantSlug}
        restaurantName={type === 'restaurant' ? restaurantName : 'Painel Revenda'}
        isOpen={isOpen}
      />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
};


import { ReactNode, useEffect, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { subscribeStoreStatus } from '@/lib/storeStatusEvent';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  const nameStorageKey = type === 'restaurant' && restaurantSlug ? `admin:restaurant:${restaurantSlug}:name` : null;
  const openStorageKey = type === 'restaurant' && restaurantSlug ? `admin:restaurant:${restaurantSlug}:is_open` : null;

  const [restaurantName, setRestaurantName] = useState<string>(() => {
    if (nameStorageKey && typeof window !== 'undefined') {
      const cached = window.sessionStorage.getItem(nameStorageKey);
      if (cached) return cached;
    }
    return 'Restaurante';
  });

  const [isOpen, setIsOpen] = useState<boolean | undefined>(() => {
    if (openStorageKey && typeof window !== 'undefined') {
      const cached = window.sessionStorage.getItem(openStorageKey);
      if (cached === 'true') return true;
      if (cached === 'false') return false;
    }
    return undefined;
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  // Re-hidrata do cache quando muda o restaurante (evita "piscar" ao trocar de página)
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantSlug) return;
    if (typeof window === 'undefined') return;

    if (nameStorageKey) {
      const cachedName = window.sessionStorage.getItem(nameStorageKey);
      if (cachedName) setRestaurantName(cachedName);
    }

    if (openStorageKey) {
      const cachedOpen = window.sessionStorage.getItem(openStorageKey);
      if (cachedOpen === 'true') setIsOpen(true);
      else if (cachedOpen === 'false') setIsOpen(false);
    }
  }, [type, restaurantSlug, nameStorageKey, openStorageKey]);

  // Busca inicial (só para id/name e para reconciliar o status caso esteja diferente no banco)
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantSlug) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, is_open')
        .eq('slug', restaurantSlug)
        .maybeSingle();

      if (!data) return;

      setRestaurantId(data.id);

      setRestaurantName((prev) => {
        const next = data.name || prev;
        if (nameStorageKey && typeof window !== 'undefined') {
          window.sessionStorage.setItem(nameStorageKey, next);
        }
        return prev === next ? prev : next;
      });

      const nextOpen = data.is_open ?? false;
      setIsOpen((prev) => {
        if (openStorageKey && typeof window !== 'undefined') {
          window.sessionStorage.setItem(openStorageKey, String(nextOpen));
        }
        return prev === nextOpen ? prev : nextOpen;
      });
    };

    fetchInitial();
  }, [type, restaurantSlug, nameStorageKey, openStorageKey]);

  // Realtime subscription para atualizar status diretamente do banco
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
            const nextOpen = payload.new.is_open ?? false;
            setIsOpen((prev) => (prev === nextOpen ? prev : nextOpen));
            if (openStorageKey && typeof window !== 'undefined') {
              window.sessionStorage.setItem(openStorageKey, String(nextOpen));
            }

            if (payload.new.name) {
              setRestaurantName((prev) => (prev === payload.new.name ? prev : payload.new.name));
              if (nameStorageKey && typeof window !== 'undefined') {
                window.sessionStorage.setItem(nameStorageKey, payload.new.name);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, restaurantId, openStorageKey, nameStorageKey]);

  // Escuta eventos de mudança de status dentro da mesma aba (broadcast local)
  useEffect(() => {
    if (!restaurantId) return;

    const unsubscribe = subscribeStoreStatus((detail) => {
      if (detail.restaurantId === restaurantId) {
        setIsOpen((prev) => (prev === detail.isOpen ? prev : detail.isOpen));
        if (openStorageKey && typeof window !== 'undefined') {
          window.sessionStorage.setItem(openStorageKey, String(detail.isOpen));
        }
      }
    });

    return unsubscribe;
  }, [restaurantId, openStorageKey]);

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

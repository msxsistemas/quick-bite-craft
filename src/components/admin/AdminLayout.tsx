import { ReactNode, useEffect, useState, useRef, useCallback } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { subscribeStoreStatus, broadcastStoreStatusChange } from '@/lib/storeStatusEvent';
import { isWithinOperatingHours } from '@/hooks/useStoreOpenStatus';
import { useGlobalKitchenNotification } from '@/hooks/useGlobalKitchenNotification';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  const nameStorageKey = type === 'restaurant' && restaurantSlug ? `admin:restaurant:${restaurantSlug}:name` : null;
  const openStorageKey = type === 'restaurant' && restaurantSlug ? `admin:restaurant:${restaurantSlug}:is_open` : null;
  const logoStorageKey = type === 'restaurant' && restaurantSlug ? `admin:restaurant:${restaurantSlug}:logo` : null;

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

  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (logoStorageKey && typeof window !== 'undefined') {
      return window.sessionStorage.getItem(logoStorageKey);
    }
    return null;
  });

  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState<boolean | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Global kitchen notification - works on any admin page
  useGlobalKitchenNotification(restaurantId ?? undefined);

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

    if (logoStorageKey) {
      const cachedLogo = window.sessionStorage.getItem(logoStorageKey);
      if (cachedLogo) setLogoUrl(cachedLogo);
    }
  }, [type, restaurantSlug, nameStorageKey, openStorageKey, logoStorageKey]);

  // Busca inicial (só para id/name/is_manual_mode e para reconciliar o status caso esteja diferente no banco)
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantSlug) return;

    const fetchInitial = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, is_open, is_manual_mode, logo')
        .eq('slug', restaurantSlug)
        .maybeSingle();

      if (!data) return;

      setRestaurantId(data.id);
      setIsManualMode(data.is_manual_mode ?? false);

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

      // Atualiza logo
      const nextLogo = data.logo || null;
      setLogoUrl((prev) => {
        if (logoStorageKey && typeof window !== 'undefined') {
          if (nextLogo) {
            window.sessionStorage.setItem(logoStorageKey, nextLogo);
          } else {
            window.sessionStorage.removeItem(logoStorageKey);
          }
        }
        return prev === nextLogo ? prev : nextLogo;
      });
    };

    fetchInitial();
  }, [type, restaurantSlug, nameStorageKey, openStorageKey, logoStorageKey]);

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

            // Atualiza o modo manual/automático
            if (typeof payload.new.is_manual_mode === 'boolean') {
              setIsManualMode(payload.new.is_manual_mode);
            }

            // Atualiza logo
            if (typeof payload.new.logo !== 'undefined') {
              const newLogo = payload.new.logo || null;
              setLogoUrl((prev) => (prev === newLogo ? prev : newLogo));
              if (logoStorageKey && typeof window !== 'undefined') {
                if (newLogo) {
                  window.sessionStorage.setItem(logoStorageKey, newLogo);
                } else {
                  window.sessionStorage.removeItem(logoStorageKey);
                }
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, restaurantId, openStorageKey, nameStorageKey, logoStorageKey]);

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

  // Sincronização automática a cada minuto (só quando em modo automático)
  const syncAutoStatus = useCallback(async () => {
    if (!restaurantId || isManualMode) return;

    try {
      const { data: hours } = await supabase
        .from('operating_hours')
        .select('*')
        .eq('restaurant_id', restaurantId);

      if (!hours || hours.length === 0) return;

      const shouldBeOpen = isWithinOperatingHours(hours);

      // Atualiza só se diferente
      setIsOpen((prev) => {
        if (prev === shouldBeOpen) return prev;

        // Persiste no banco
        supabase
          .from('restaurants')
          .update({ is_open: shouldBeOpen })
          .eq('id', restaurantId)
          .then(() => {
            broadcastStoreStatusChange(restaurantId, shouldBeOpen);
          });

        if (openStorageKey && typeof window !== 'undefined') {
          window.sessionStorage.setItem(openStorageKey, String(shouldBeOpen));
        }

        return shouldBeOpen;
      });
    } catch (error) {
      console.error('Error syncing auto status in sidebar:', error);
    }
  }, [restaurantId, isManualMode, openStorageKey]);

  useEffect(() => {
    // Limpa intervalo anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Só ativa quando em modo automático e temos o restaurantId
    if (!restaurantId || isManualMode === null || isManualMode) return;

    // Sync imediato
    syncAutoStatus();

    // Sync a cada 60 segundos
    intervalRef.current = setInterval(syncAutoStatus, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [restaurantId, isManualMode, syncAutoStatus]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar
        type={type}
        restaurantSlug={restaurantSlug}
        restaurantName={type === 'restaurant' ? restaurantName : 'Painel Revenda'}
        isOpen={isOpen}
        logoUrl={type === 'restaurant' ? logoUrl : null}
        restaurantId={restaurantId ?? undefined}
      />
      {/* Mobile top padding + responsive main margin */}
      <main className="pt-14 lg:pt-0 lg:ml-64 p-4 lg:p-8">{children}</main>
    </div>
  );
};

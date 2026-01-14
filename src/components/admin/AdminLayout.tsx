import { ReactNode, useEffect, useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';
import { useStoreOpenSync } from '@/hooks/useStoreOpenStatus';
import { subscribeStoreManualMode } from '@/lib/storeStatusMode';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  const [restaurantId, setRestaurantId] = useState<string | undefined>(undefined);
  const [restaurantName, setRestaurantName] = useState<string>('Restaurante');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      if (type !== 'restaurant' || !restaurantSlug) return;

      const { data } = await supabase
        .from('restaurants')
        .select('id, name, is_open, is_manual_mode')
        .eq('slug', restaurantSlug)
        .single();

      if (data) {
        setRestaurantId(data.id);
        setRestaurantName(data.name);
        setIsOpen(data.is_open ?? false);
        setIsManualMode(data.is_manual_mode ?? false);
      }
    };

    fetchRestaurantInfo();
  }, [type, restaurantSlug]);

  // Keep manual mode in sync across the admin panel (e.g., when toggled in Settings).
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantId) return;

    return subscribeStoreManualMode(({ restaurantId: changedId, manual }) => {
      if (changedId === restaurantId) setIsManualMode(manual);
    });
  }, [type, restaurantId]);

  // Auto-sync open/closed status with operating hours whenever manual mode is disabled.
  useStoreOpenSync(restaurantId, isManualMode, (newStatus) => {
    setIsOpen(newStatus);
  });

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


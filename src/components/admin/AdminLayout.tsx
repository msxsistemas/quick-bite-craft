import { ReactNode, useEffect, useState, useRef } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { supabase } from '@/integrations/supabase/client';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  const [restaurantName, setRestaurantName] = useState<string>('Restaurante');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const didFetchRef = useRef(false);

  useEffect(() => {
    // Só busca uma vez por slug para evitar loops
    if (type !== 'restaurant' || !restaurantSlug || didFetchRef.current) return;

    const fetchRestaurantInfo = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('name, is_open')
        .eq('slug', restaurantSlug)
        .maybeSingle();

      if (data) {
        setRestaurantName(data.name);
        setIsOpen(data.is_open ?? false);
      }
    };

    didFetchRef.current = true;
    fetchRestaurantInfo();
  }, [type, restaurantSlug]);

  // Realtime subscription para atualizar status sem refetch
  useEffect(() => {
    if (type !== 'restaurant' || !restaurantSlug) return;

    const channel = supabase
      .channel(`sidebar-restaurant-${restaurantSlug}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'restaurants',
        },
        (payload) => {
          if (payload.new && payload.new.slug === restaurantSlug) {
            setIsOpen(payload.new.is_open ?? false);
            if (payload.new.name) setRestaurantName(payload.new.name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [type, restaurantSlug]);

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


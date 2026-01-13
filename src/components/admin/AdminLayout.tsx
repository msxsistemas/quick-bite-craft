import { ReactNode, useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      if (type === 'restaurant' && restaurantSlug) {
        const { data } = await supabase
          .from('restaurants')
          .select('name, is_open')
          .eq('slug', restaurantSlug)
          .single();
        
        if (data) {
          setRestaurantName(data.name);
          setIsOpen(data.is_open ?? false);
        }
      }
    };

    fetchRestaurantInfo();
  }, [type, restaurantSlug]);

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar 
        type={type} 
        restaurantSlug={restaurantSlug} 
        restaurantName={type === 'restaurant' ? restaurantName : 'Painel Revenda'}
        isOpen={isOpen}
      />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

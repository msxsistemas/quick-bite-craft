import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';

interface AdminLayoutProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  children: ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ type, restaurantSlug, children }) => {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar type={type} restaurantSlug={restaurantSlug} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

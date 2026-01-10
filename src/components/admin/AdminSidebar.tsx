import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FolderTree,
  Settings,
  LogOut,
  Store,
  Users,
  BarChart3,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ type, restaurantSlug }) => {
  const location = useLocation();

  const basePath = type === 'reseller' ? '/reseller' : `/r/${restaurantSlug}/admin`;

  const resellerLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `${basePath}/dashboard` },
    { icon: Store, label: 'Restaurantes', path: `${basePath}/restaurants` },
    { icon: Users, label: 'Usuários', path: `${basePath}/users` },
    { icon: BarChart3, label: 'Relatórios', path: `${basePath}/reports` },
    { icon: Settings, label: 'Configurações', path: `${basePath}/settings` },
  ];

  const restaurantLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `${basePath}/dashboard` },
    { icon: ShoppingBag, label: 'Pedidos', path: `${basePath}/orders` },
    { icon: Package, label: 'Produtos', path: `${basePath}/products` },
    { icon: FolderTree, label: 'Categorias', path: `${basePath}/categories` },
    { icon: Settings, label: 'Configurações', path: `${basePath}/settings` },
  ];

  const links = type === 'reseller' ? resellerLinks : restaurantLinks;

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning rounded-full flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">Delivery Express</h1>
            <p className="text-xs text-muted-foreground capitalize">{type}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-delivery"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <link.icon className="w-5 h-5" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Link
          to={type === 'reseller' ? '/reseller' : `/r/${restaurantSlug}/admin`}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </Link>
      </div>
    </aside>
  );
};

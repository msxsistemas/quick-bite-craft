// AdminSidebar - Updated with responsive mobile support and notification badges
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChefHat,
  UserCheck,
  Plus,
  Ticket,
  Clock,
  MapPin,
  Eye,
  ExternalLink,
  Star,
  BookOpen,
  Menu,
  X,
  MessageSquare,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurantAdminSafe } from '@/hooks/useRestaurantAdmin';
import { toast } from '@/components/ui/app-toast';
import { usePendingOrdersCount } from '@/hooks/usePendingOrdersCount';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminSidebarProps {
  type: 'reseller' | 'restaurant';
  restaurantSlug?: string;
  restaurantName?: string;
  isOpen?: boolean;
  logoUrl?: string | null;
  restaurantId?: string;
}

interface NavGroup {
  title: string;
  links: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    external?: boolean;
    badge?: number;
    badgeColor?: string;
  }[];
}

const NotificationBadge = ({ count, color = 'bg-red-500' }: { count: number; color?: string }) => {
  if (count === 0) return null;
  return (
    <span className={cn(
      "ml-auto min-w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold text-white",
      color
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  type, 
  restaurantSlug, 
  restaurantName = 'Restaurante',
  isOpen,
  logoUrl,
  restaurantId
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Only use the restaurant admin hook for restaurant type
  const restaurantAdminContext = type === 'restaurant' ? useRestaurantAdminSafe() : null;
  const admin = restaurantAdminContext?.admin ?? null;
  const logoutRestaurantAdmin = restaurantAdminContext?.logout;

  // Get pending orders count for badge
  const { data: orderCounts } = usePendingOrdersCount(restaurantId);
  const pendingCount = orderCounts?.pending || 0;
  const preparingCount = orderCounts?.preparing || 0;

  const handleLogout = async () => {
    try {
      if (type === 'restaurant' && logoutRestaurantAdmin) {
        logoutRestaurantAdmin();
        toast.success('Logout realizado com sucesso!');
        navigate(`/r/${restaurantSlug}/admin/login`);
      } else {
        await supabase.auth.signOut();
        toast.success('Logout realizado com sucesso!');
        navigate('/reseller');
      }
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const basePath = type === 'reseller' ? '/reseller' : `/r/${restaurantSlug}/admin`;

  const resellerLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: `${basePath}/dashboard` },
    { icon: Store, label: 'Restaurantes', path: `${basePath}/restaurants` },
    { icon: Ticket, label: 'Mensalidades', path: `${basePath}/subscriptions` },
    { icon: BarChart3, label: 'Relatórios', path: `${basePath}/reports` },
    { icon: Settings, label: 'Configurações', path: `${basePath}/settings` },
  ];

  const restaurantGroups: NavGroup[] = [
    {
      title: 'OPERAÇÕES',
      links: [
        { icon: LayoutDashboard, label: 'Dashboard', path: `${basePath}/dashboard` },
        { icon: Store, label: 'PDV', path: `${basePath}/pdv` },
        { icon: ChefHat, label: 'Cozinha', path: `${basePath}/kitchen`, external: true, badge: preparingCount, badgeColor: 'bg-orange-500' },
        { icon: UserCheck, label: 'Garçons', path: `${basePath}/waiters` },
        { icon: Users, label: 'Acesso Garçons', path: `${basePath}/waiter-access`, external: true },
      ],
    },
    {
      title: 'GESTÃO',
      links: [
        { icon: ShoppingBag, label: 'Pedidos', path: `${basePath}/orders`, badge: pendingCount, badgeColor: 'bg-red-500' },
        { icon: Package, label: 'Produtos', path: `${basePath}/products` },
        { icon: FolderTree, label: 'Categorias', path: `${basePath}/categories` },
        { icon: Plus, label: 'Acréscimos', path: `${basePath}/extras` },
        { icon: Ticket, label: 'Cupons', path: `${basePath}/coupons` },
        { icon: Star, label: 'Fidelidade', path: `${basePath}/loyalty` },
        { icon: MessageSquare, label: 'Avaliações', path: `${basePath}/suggestions` },
        { icon: BookOpen, label: 'Gestor de Cardápio', path: `${basePath}/menu-manager` },
      ],
    },
    {
      title: 'SISTEMA',
      links: [
        { icon: WhatsAppIcon, label: 'WhatsApp', path: `${basePath}/whatsapp` },
        { icon: MapPin, label: 'Taxas de Entrega', path: `${basePath}/delivery-fees` },
        { icon: Clock, label: 'Horários', path: `${basePath}/hours` },
        { icon: Settings, label: 'Configurações', path: `${basePath}/settings` },
      ],
    },
    {
      title: 'VISUALIZAR',
      links: [
        { icon: Eye, label: 'Ver Cardápio', path: `/r/${restaurantSlug}`, external: true },
      ],
    },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{restaurantName}</h1>
            {type === 'restaurant' && typeof isOpen === 'boolean' && (
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                isOpen ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              )}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {type === 'reseller' ? (
          <div className="px-3 space-y-1">
            {resellerLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <>
            {restaurantGroups.map((group) => (
              <div key={group.title} className="mb-4">
                <div className="px-4 py-2">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                    {group.title}
                  </span>
                </div>
                <div className="px-3 space-y-0.5">
                  {group.links.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        target={link.external ? '_blank' : undefined}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <link.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium flex-1">{link.label}</span>
                        {link.badge !== undefined && link.badge > 0 && (
                          <NotificationBadge count={link.badge} color={link.badgeColor} />
                        )}
                        {link.external && (
                          <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
            {type === 'restaurant' && admin ? admin.email.charAt(0).toUpperCase() : 'R'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {type === 'restaurant' && admin ? admin.email : 'restaurante@demo.com'}
            </p>
            <p className="text-xs text-muted-foreground">
              {type === 'restaurant' && admin?.is_owner ? 'Proprietário' : 'Administrador'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 w-full text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-14 flex items-center px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 flex flex-col">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-3 ml-3">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={restaurantName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <span className="font-semibold text-foreground truncate">{restaurantName}</span>
        </div>
        {pendingCount > 0 && (
          <div className="ml-auto">
            <NotificationBadge count={pendingCount} />
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-56 bg-card border-r border-border flex-col z-50">
        <SidebarContent />
      </aside>
    </>
  );
};

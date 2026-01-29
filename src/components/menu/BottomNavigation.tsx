import { useNavigate, useParams } from 'react-router-dom';
import { Home, ClipboardList, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface BottomNavigationProps {
  activeTab: 'home' | 'orders' | 'cart';
  onCartClick?: () => void;
  hidden?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onCartClick,
  hidden = false,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { getTotalItems } = useCart();
  
  const totalItems = getTotalItems();

  const tabs = [
    {
      id: 'home' as const,
      label: 'Início',
      icon: Home,
      onClick: () => navigate(`/r/${slug}`),
    },
    {
      id: 'orders' as const,
      label: 'Pedidos',
      icon: ClipboardList,
      onClick: () => navigate(`/r/${slug}/pedidos`),
    },
    {
      id: 'cart' as const,
      label: 'Carrinho',
      icon: ShoppingCart,
      onClick: onCartClick || (() => {}),
      badge: totalItems > 0 ? totalItems : undefined,
    },
  ];

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="max-w-md mx-auto flex items-center justify-center gap-16 py-1.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 relative ${
                isActive ? 'text-blue-500' : 'text-muted-foreground'
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
              
              <div className="relative">
                <Icon className="w-5 h-5" />
                
                {/* Badge for cart or orders */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

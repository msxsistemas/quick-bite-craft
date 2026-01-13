import { Settings, ClipboardList } from 'lucide-react';
import { Restaurant } from '@/types/delivery';
import { useCart } from '@/contexts/CartContext';

interface MenuHeaderProps {
  restaurant: Restaurant;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ restaurant }) => {
  const { getTotalItems, setIsOpen } = useCart();
  const totalItems = getTotalItems();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl">🍔</span>
            )}
          </div>
          <span className="font-bold text-lg text-foreground">{restaurant.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
          
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <div className="relative">
              <ClipboardList className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span>Meu Pedido</span>
          </button>
        </div>
      </div>
    </header>
  );
};

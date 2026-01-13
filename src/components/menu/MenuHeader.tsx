import { Settings, ClipboardList, History } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { PublicRestaurant } from '@/hooks/usePublicMenu';
import { useCart } from '@/contexts/CartContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuHeaderProps {
  restaurant: PublicRestaurant;
}

export const MenuHeader: React.FC<MenuHeaderProps> = ({ restaurant }) => {
  const { slug } = useParams<{ slug: string }>();
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/r/${slug}/orders`} className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Meus Pedidos
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
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

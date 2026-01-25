import { ChevronRight, Search } from 'lucide-react';
import { PublicRestaurant } from '@/hooks/usePublicMenu';
import { usePublicOperatingHours } from '@/hooks/usePublicOperatingHours';

interface RestaurantHeaderProps {
  restaurant: PublicRestaurant;
  onSearchClick?: () => void;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant, onSearchClick }) => {
  const { getTodayHours, getNextOpeningInfo } = usePublicOperatingHours(restaurant.id);

  const getStoreStatusText = () => {
    if (restaurant.is_open) {
      const todayHours = getTodayHours();
      if (todayHours) {
        const closeTime = todayHours.end_time.slice(0, 5);
        return `Aberta, fecha às ${closeTime}`;
      }
      return 'Aberta';
    } else {
      const nextOpening = getNextOpeningInfo();
      if (nextOpening) {
        const time = nextOpening.time.slice(0, 5);
        if (nextOpening.dayName === 'Hoje') {
          return `Loja fechada, abre hoje às ${time}`;
        } else if (nextOpening.dayName === 'Amanhã') {
          return `Loja fechada, abre amanhã às ${time}`;
        }
        return `Loja fechada, abre ${nextOpening.dayName} às ${time}`;
      }
      return 'Loja fechada';
    }
  };

  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="h-48 md:h-64 relative overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
        {restaurant.banner && (
          <img
            src={restaurant.banner}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {/* Search Button */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="absolute top-4 right-4 p-2.5 bg-card/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-card transition-colors"
            aria-label="Pesquisar"
          >
            <Search className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>

      {/* Restaurant Info Card */}
      <div className="relative mx-4 -mt-16 z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-4">
          {/* Logo */}
          <div className="flex justify-center -mt-12 mb-3">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-card shadow-md overflow-hidden">
              {restaurant.logo ? (
                <img
                  src={restaurant.logo}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-xl font-semibold text-muted-foreground" aria-hidden="true">
                    {restaurant.name?.trim()?.charAt(0)?.toUpperCase() || 'R'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Restaurant Name */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                {restaurant.name}
                {restaurant.is_open && (
                  <span className="w-2 h-2 rounded-full bg-green-500" title="Aberto" />
                )}
              </h1>
              <p className="text-sm text-muted-foreground">
                {restaurant.address || 'Delivery'}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* Delivery Info (moved from bottom) */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Padrão</span>
            <span>•</span>
            <span>{restaurant.delivery_time || '40-50 min'}</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* Store Status */}
          <div className="flex items-center gap-2 text-sm">
            <span className={restaurant.is_open ? 'text-green-600 font-medium' : 'text-destructive font-medium'}>
              {getStoreStatusText()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
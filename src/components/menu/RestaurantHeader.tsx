import { ChevronRight, Star } from 'lucide-react';
import { PublicRestaurant } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';

// Demo images for restaurant without custom images
import demoBanner from '@/assets/demo/banner-restaurant.jpg';
import demoLogo from '@/assets/demo/logo-restaurant.jpg';

interface RestaurantHeaderProps {
  restaurant: PublicRestaurant;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="h-48 md:h-64 relative overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
        <img
          src={restaurant.banner || demoBanner}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />

      </div>

      {/* Restaurant Info Card */}
      <div className="relative mx-4 -mt-16 z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-4">
          {/* Logo */}
          <div className="flex justify-center -mt-12 mb-3">
            <div className="w-20 h-20 rounded-full bg-card border-4 border-card shadow-md overflow-hidden">
              <img
                src={restaurant.logo || demoLogo}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
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

          {/* Rating */}
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">4.7</span>
            <span className="text-muted-foreground">(avaliações)</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
          </div>

          {/* Divider */}
          <div className="h-px bg-border my-3" />

          {/* Delivery Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Padrão</span>
            <span>•</span>
            <span>{restaurant.delivery_time || '40-50 min'}</span>
            <span>•</span>
            <span className="font-medium text-foreground">
              {restaurant.delivery_fee ? formatCurrency(restaurant.delivery_fee) : 'Grátis'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

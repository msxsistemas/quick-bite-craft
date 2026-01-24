import { ChevronLeft, Heart, Search, ChevronRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PublicRestaurant } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';

interface RestaurantHeaderProps {
  restaurant: PublicRestaurant;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="h-48 md:h-64 relative overflow-hidden bg-gradient-to-br from-primary/30 to-primary/10">
        {restaurant.banner ? (
          <img
            src={restaurant.banner}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}

        {/* Top Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between safe-area-top">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              <Heart className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
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
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-3xl text-white font-bold">
                    {restaurant.name.charAt(0)}
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

import { Clock, Phone, MapPin, Bike } from 'lucide-react';
import { PublicRestaurant } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';

interface RestaurantHeaderProps {
  restaurant: PublicRestaurant;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({ restaurant }) => {
  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-32 md:h-48 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {restaurant.banner ? (
          <>
            <img
              src={restaurant.banner}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Restaurant Info */}
      <div className="relative px-4 pb-4">
        {/* Logo */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-20 h-20 rounded-full border-4 border-card overflow-hidden shadow-lg bg-card">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary/50">
                <span className="text-2xl font-bold text-primary-foreground">
                  {restaurant.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="pt-12 text-center">
          <h1 className="text-xl font-bold text-foreground">{restaurant.name}</h1>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 space-y-3 mt-2">
        {/* Open/Closed Status */}
        <div className="flex items-center justify-between py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className={`font-medium ${restaurant.is_open ? 'text-green-600' : 'text-destructive'}`}>
                {restaurant.is_open ? 'Aberto' : 'Fechado'}
              </p>
              <p className="text-sm text-muted-foreground">
                {restaurant.is_open ? 'Recebendo pedidos' : 'Fora do horário de atendimento'}
              </p>
            </div>
          </div>
          <button className="text-sm font-medium text-primary hover:underline">
            VER HORÁRIOS
          </button>
        </div>

        {/* Phone */}
        {restaurant.phone && (
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{restaurant.phone}</p>
                <p className="text-sm text-muted-foreground">Entre em contato</p>
              </div>
            </div>
            {restaurant.whatsapp && (
              <a
                href={`https://wa.me/${restaurant.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                WHATSAPP
              </a>
            )}
          </div>
        )}

        {/* Location */}
        {restaurant.address && (
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Localização</p>
                <p className="text-sm text-muted-foreground max-w-[200px] truncate">{restaurant.address}</p>
              </div>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              DIREÇÕES
            </a>
          </div>
        )}

        {/* Delivery Info */}
        <div className="flex items-center gap-3 py-3">
          <Bike className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Tempo de entrega</p>
            <p className="text-sm text-muted-foreground">
              {restaurant.delivery_time || '30-45 min'} • TAXA: {restaurant.delivery_fee ? formatCurrency(restaurant.delivery_fee) : 'Grátis'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

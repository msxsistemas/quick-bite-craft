import { useState, useEffect } from 'react';
import { Plus, Clock } from 'lucide-react';
import { PublicProduct } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';

// Inline Promo Timer
const PromoTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirou');
        return;
      }

      setIsUrgent(diff < 24 * 60 * 60 * 1000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, isUrgent ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [expiresAt, isUrgent]);

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] ${
      isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500 animate-pulse' : 'text-orange-500'
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {timeLeft}
    </span>
  );
};

interface ProductCardProps {
  product: PublicProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  const isPromo = product.is_promo && product.promo_price !== null && product.promo_price !== undefined;
  const displayPrice = isPromo ? product.promo_price! : product.price;
  const discountPercent = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: displayPrice,
      image: product.image_url || '',
      categoryId: product.category || '',
      isAvailable: true,
    };
    addItem(cartProduct, 1);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3 flex gap-3 relative">
      {/* Promo Badge */}
      {isPromo && (
        <div className="absolute -top-2 -left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
          -{discountPercent}%
        </div>
      )}

      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-2xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-semibold text-foreground text-sm line-clamp-1">
          {product.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">
          {product.description || ''}
        </p>
        <div className="mt-2">
          {isPromo ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground text-xs line-through">
                {formatCurrency(product.price)}
              </span>
              <span className="text-green-600 font-bold text-sm">
                {formatCurrency(product.promo_price!)}
              </span>
              {product.promo_expires_at && <PromoTimer expiresAt={product.promo_expires_at} />}
            </div>
          ) : (
            <p className="text-primary font-bold text-sm">
              {formatCurrency(product.price)}
            </p>
          )}
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        className="self-end flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-lg"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

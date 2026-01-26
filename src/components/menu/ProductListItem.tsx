import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { PublicProduct } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';

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
    <span className={`inline-flex items-center gap-0.5 text-xs ${
      isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500 animate-pulse' : 'text-orange-500'
    }`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
};

export interface ProductListItemProps {
  product: PublicProduct;
  onProductClick?: (product: PublicProduct) => void;
  showPopularBadge?: boolean;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ 
  product, 
  onProductClick,
  showPopularBadge = false 
}) => {
  const isPromo = product.is_promo && product.promo_price !== null && product.promo_price !== undefined;
  const displayPrice = isPromo ? product.promo_price! : product.price;
  const discountPercent = isPromo ? Math.round(((product.price - product.promo_price!) / product.price) * 100) : 0;
  const isSoldOut = product.sold_out;

  const handleClick = () => {
    if (onProductClick && !isSoldOut) {
      onProductClick(product);
    }
  };

  return (
    <div 
      className={`flex gap-3 py-4 border-b border-border last:border-b-0 cursor-pointer transition-opacity ${
        isSoldOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/30'
      }`}
      onClick={handleClick}
    >
      {/* Content - Left side */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Popular Badge */}
        {showPopularBadge && (
          <span className="inline-flex items-center self-start text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded mb-1.5">
            O mais pedido
          </span>
        )}

        {/* Product Name */}
        <h4 className="font-bold text-foreground text-base line-clamp-2 leading-tight">
          {product.name}
        </h4>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 leading-snug font-normal">
            {product.description}
          </p>
        )}

        {/* Sold Out */}
        {isSoldOut && (
          <span className="text-sm text-red-500 font-medium mt-2">
            Indisponível
          </span>
        )}

        {/* Price Section */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {isPromo ? (
            <>
              <span className="text-base font-bold" style={{ color: 'hsl(220, 13%, 13%)' }}>
                {formatCurrency(displayPrice)}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(product.price)}
              </span>
              <span className="text-xs font-bold text-white bg-green-600 px-1.5 py-0.5 rounded">
                -{discountPercent}%
              </span>
            </>
          ) : (
            <span className="text-base font-bold" style={{ color: 'hsl(220, 13%, 13%)' }}>
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {/* Promo Timer */}
        {isPromo && product.promo_expires_at && (
          <div className="mt-1">
            <PromoTimer expiresAt={product.promo_expires_at} />
          </div>
        )}
      </div>

      {/* Image - Right side */}
      {product.image_url && (
        <div className="relative flex-shrink-0">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-muted">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Discount Badge on Image */}
          {isPromo && (
            <div className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
              -{discountPercent}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};

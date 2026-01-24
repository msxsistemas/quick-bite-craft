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
    <span className={`inline-flex items-center gap-0.5 text-[10px] ${
      isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500 animate-pulse' : 'text-orange-500'
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {timeLeft}
    </span>
  );
};

interface HighlightsCarouselProps {
  products: PublicProduct[];
  onProductClick: (product: PublicProduct) => void;
}

export const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({
  products,
  onProductClick,
}) => {
  // Get promo products or first 6 products
  const highlightProducts = products.filter(p => p.is_promo && !p.sold_out).slice(0, 8);
  
  if (highlightProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-4">
      <h2 className="text-xl font-bold text-foreground mb-4 px-4">Destaques</h2>
      
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
        {highlightProducts.map((product, index) => {
          const isPromo = product.is_promo && product.promo_price !== null;
          const displayPrice = isPromo ? product.promo_price! : product.price;
          const discountPercent = isPromo 
            ? Math.round(((product.price - product.promo_price!) / product.price) * 100) 
            : 0;

          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-36 cursor-pointer"
              onClick={() => onProductClick(product)}
            >
              {/* Image */}
              <div className="relative w-36 h-36 rounded-lg overflow-hidden bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <span className="text-4xl">🍽️</span>
                  </div>
                )}

                {/* Badges */}
                {index === 0 && (
                  <span className="absolute top-2 left-2 text-[10px] font-medium text-white bg-black/70 px-1.5 py-0.5 rounded">
                    Mais pedido
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mt-2">
                {isPromo ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(displayPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrency(product.price)}
                    </span>
                    <span className="text-[10px] font-bold text-white bg-green-600 px-1 py-0.5 rounded">
                      -{discountPercent}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-foreground">
                    a partir de<br />
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-sm font-medium text-foreground line-clamp-2 mt-1 leading-tight">
                {product.name}
              </h4>

              {/* Promo Timer */}
              {isPromo && product.promo_expires_at && (
                <PromoTimer expiresAt={product.promo_expires_at} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

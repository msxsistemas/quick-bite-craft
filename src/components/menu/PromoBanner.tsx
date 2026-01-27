import React from 'react';
import { Ticket } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { usePublicCoupons } from '@/hooks/usePublicCoupons';

interface PromoBannerProps {
  restaurantId: string | undefined;
  onCouponClick?: () => void;
}

export const PromoBanner: React.FC<PromoBannerProps> = ({ restaurantId, onCouponClick }) => {
  const { hasCoupons, maxDiscount, maxPercentDiscount, isLoading } = usePublicCoupons(restaurantId);

  if (isLoading || !hasCoupons) return null;

  // Determine the best discount to show
  const hasFixedDiscount = maxDiscount > 0;
  const hasPercentDiscount = maxPercentDiscount > 0;

  if (!hasFixedDiscount && !hasPercentDiscount) return null;

  const discountText = hasFixedDiscount 
    ? `${formatCurrency(maxDiscount)} OFF`
    : `${maxPercentDiscount}% OFF`;

  return (
    <div 
      onClick={onCouponClick}
      className="mx-4 mt-4 cursor-pointer group"
    >
      <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 shadow-delivery transition-all duration-300 group-hover:shadow-delivery-lg group-hover:scale-[1.01]">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white rounded-full" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white rounded-full" />
        </div>
        
        <div className="relative flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Ticket className="w-6 h-6 text-primary-foreground" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-primary-foreground/80 uppercase tracking-wide">
                Cupom disponível
              </span>
              <span className="animate-pulse w-2 h-2 bg-white rounded-full" />
            </div>
            <p className="text-lg font-bold text-primary-foreground mt-0.5">
              Ganhe até <span className="text-white">{discountText}</span>
            </p>
          </div>
          
          {/* Arrow */}
          <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
            <svg 
              className="w-4 h-4 text-primary-foreground transform group-hover:translate-x-0.5 transition-transform" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

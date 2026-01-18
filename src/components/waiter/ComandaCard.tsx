import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Comanda } from '@/hooks/useComandas';

interface ComandaCardProps {
  comanda: Comanda;
  hasOrders: boolean;
  hasCartItems?: boolean;
  onClick: () => void;
}

export const ComandaCard = ({ comanda, hasOrders, hasCartItems = false, onClick }: ComandaCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevHasOrders, setPrevHasOrders] = useState(hasOrders);

  // Comanda is only considered occupied if it has orders (not just customer_name)
  const isOccupied = hasOrders;
  const isRequesting = comanda.status === 'requesting';

  // Detect status change and trigger animation
  useEffect(() => {
    if (prevHasOrders !== hasOrders) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      setPrevHasOrders(hasOrders);
      return () => clearTimeout(timer);
    }
  }, [hasOrders, prevHasOrders]);

  // Define colors based on status - exactly like TableCard
  const getBgColor = () => {
    if (isRequesting) return 'bg-amber-500';
    if (isOccupied) return 'bg-[#f26b5b]';
    return 'bg-[#1e3a5f]';
  };

  const getBorderColor = () => {
    if (isRequesting) return 'border-amber-600';
    if (isOccupied) return 'border-[#f26b5b]';
    return 'border-[#1e4976]';
  };

  return (
    <button
      onClick={onClick}
      className={`
        h-[72px] rounded-md p-3 border-l-4 flex flex-col justify-start items-start text-left 
        transition-all duration-300 ease-out hover:opacity-90 relative
        ${getBgColor()} ${getBorderColor()}
        ${isAnimating ? 'animate-scale-in' : ''}
      `}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col">
          <span className="text-white font-bold text-base leading-tight">{comanda.number}</span>
          {/* Show customer name if saved */}
          {comanda.customer_name && (
            <span className="text-white/80 text-sm leading-tight">
              {comanda.customer_name}
            </span>
          )}
        </div>
        {hasCartItems && (
          <div className="text-white/80">
            <ShoppingCart className="w-4 h-4" />
          </div>
        )}
      </div>
      
    </button>
  );
};

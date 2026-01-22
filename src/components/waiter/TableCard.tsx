import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Table } from '@/hooks/useTables';

interface TableCardProps {
  table: Table;
  hasPendingOrder: boolean;
  isOccupied?: boolean;
  hasActivePayment?: boolean;
  pendingOrdersCount?: number;
  cartItemsCount?: number;
  onClick: () => void;
}

export const TableCard = ({ table, hasPendingOrder, isOccupied: isOccupiedProp, hasActivePayment = false, pendingOrdersCount = 0, cartItemsCount = 0, onClick }: TableCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStatus, setPrevStatus] = useState(table.status);

  // Table is considered occupied (red) if it has any active order
  const isOccupied = isOccupiedProp ?? hasPendingOrder;
  const isRequesting = table.status === 'requesting';
  const isPaymentInProgress = hasActivePayment && !isRequesting;

  // Detect status change and trigger animation
  useEffect(() => {
    if (prevStatus !== table.status) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      setPrevStatus(table.status);
      return () => clearTimeout(timer);
    }
  }, [table.status, prevStatus]);

  // Define colors based on status: yellow for payment in progress, red for occupied, blue for free
  const getBgColor = () => {
    if (isRequesting) return 'bg-amber-500';
    if (isPaymentInProgress) return 'bg-amber-500';
    if (isOccupied) return 'bg-[#f26b5b]';
    return 'bg-[#1e3a5f]';
  };

  const getBorderColor = () => {
    if (isRequesting) return 'border-amber-600';
    if (isPaymentInProgress) return 'border-amber-600';
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
          <span className="text-white font-bold text-base leading-tight">{table.name}</span>
          {/* Show customer name only if occupied (has pending orders) */}
          {isOccupied && table.customer_name && (
            <span className="text-white/80 text-sm leading-tight">
              {table.customer_name}
            </span>
          )}
          {/* Show pending orders count */}
          {pendingOrdersCount > 0 && (
            <span className="text-amber-300 text-xs font-medium mt-0.5">
              {pendingOrdersCount} pedido{pendingOrdersCount > 1 ? 's' : ''} pendente{pendingOrdersCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {cartItemsCount > 0 && (
          <div className="relative text-white/80">
            <ShoppingCart className="w-4 h-4" />
            <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {cartItemsCount > 9 ? '9+' : cartItemsCount}
            </span>
          </div>
        )}
      </div>
      
    </button>
  );
};

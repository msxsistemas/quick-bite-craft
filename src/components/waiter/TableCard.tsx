import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Table } from '@/hooks/useTables';

interface TableCardProps {
  table: Table;
  hasPendingOrder: boolean;
  hasCartItems?: boolean;
  onClick: () => void;
}

export const TableCard = ({ table, hasPendingOrder, hasCartItems = false, onClick }: TableCardProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStatus, setPrevStatus] = useState(table.status);

  // Table is only considered occupied (red) if it has a pending order
  const isOccupied = hasPendingOrder;
  const isRequesting = table.status === 'requesting';

  // Detect status change and trigger animation
  useEffect(() => {
    if (prevStatus !== table.status) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      setPrevStatus(table.status);
      return () => clearTimeout(timer);
    }
  }, [table.status, prevStatus]);

  // Define colors based on status
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
          <span className="text-white font-bold text-base leading-tight">{table.name}</span>
          {/* Show customer name only if occupied (has pending orders) */}
          {isOccupied && table.customer_name && (
            <span className="text-white/80 text-sm leading-tight">
              {table.customer_name}
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

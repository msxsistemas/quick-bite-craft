import { useState, useEffect } from 'react';
import { ShoppingCart, Clock } from 'lucide-react';
import { Comanda } from '@/hooks/useComandas';
import { formatCurrency } from '@/lib/format';

interface ComandaCardProps {
  comanda: Comanda;
  hasOrders: boolean;
  total: number;
  createdAt?: Date | null;
  onClick: () => void;
}

const formatOccupationTime = (startTime: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - startTime.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 60) {
    return `${diffMinutes}min`;
  }
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (minutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h${minutes}m`;
};

export const ComandaCard = ({ comanda, hasOrders, total, createdAt, onClick }: ComandaCardProps) => {
  const [occupationTime, setOccupationTime] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevHasOrders, setPrevHasOrders] = useState(hasOrders);

  // Detect status change and trigger animation
  useEffect(() => {
    if (prevHasOrders !== hasOrders) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 500);
      setPrevHasOrders(hasOrders);
      return () => clearTimeout(timer);
    }
  }, [hasOrders, prevHasOrders]);

  // Update occupation time every minute
  useEffect(() => {
    if (!createdAt || !hasOrders) {
      setOccupationTime('');
      return;
    }

    const updateTime = () => {
      setOccupationTime(formatOccupationTime(createdAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [createdAt, hasOrders]);

  // Define colors based on status
  const getBgColor = () => {
    if (hasOrders) return 'bg-[#f26b5b]';
    return 'bg-[#1e3a5f]';
  };

  const getBorderColor = () => {
    if (hasOrders) return 'border-[#f26b5b]';
    return 'border-[#1e4976]';
  };

  return (
    <button
      onClick={onClick}
      className={`
        h-[72px] rounded-md p-3 border-l-4 flex flex-col justify-between items-start text-left 
        transition-all duration-300 ease-out hover:opacity-90 relative 
        ${getBgColor()} ${getBorderColor()}
        ${isAnimating ? 'animate-scale-in' : ''}
      `}
    >
      <div className="flex items-start justify-between w-full">
        <span className="text-white font-bold text-sm">#{comanda.number}</span>
        {hasOrders && (
          <div className="text-white/80">
            <ShoppingCart className="w-4 h-4" />
          </div>
        )}
      </div>
      
      {/* Show total or "Disponível" */}
      <div className="flex items-center justify-between w-full mt-auto">
        <span className="text-cyan-400 text-xs font-medium">
          {hasOrders ? formatCurrency(total) : 'Disponível'}
        </span>
        
        {/* Occupation time indicator */}
        {hasOrders && occupationTime && (
          <div className="flex items-center gap-1 text-white/90">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">{occupationTime}</span>
          </div>
        )}
      </div>
    </button>
  );
};

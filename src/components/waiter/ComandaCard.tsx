import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Comanda } from '@/hooks/useComandas';

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

  const isOccupied = hasOrders || !!comanda.customer_name;

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
    if (isOccupied) return 'bg-[#8B4513]'; // Brown color like in image
    return 'bg-[#1e3a5f]';
  };

  const getBorderColor = () => {
    if (isOccupied) return 'border-[#8B4513]';
    return 'border-[#1e4976]';
  };

  return (
    <button
      onClick={onClick}
      className={`
        min-h-[72px] rounded-md p-3 border-l-4 flex flex-col justify-start items-start text-left 
        transition-all duration-300 ease-out hover:opacity-90 relative gap-1
        ${getBgColor()} ${getBorderColor()}
        ${isAnimating ? 'animate-scale-in' : ''}
      `}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col">
          <span className="text-cyan-400 text-[10px] font-medium uppercase">Comanda</span>
          <span className="text-white font-bold text-lg leading-tight">{comanda.number}</span>
        </div>
        {/* Occupation time indicator */}
        {hasOrders && occupationTime && (
          <div className="flex items-center gap-1 text-white/90">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">{occupationTime}</span>
          </div>
        )}
      </div>
      
      {/* Show customer name if exists */}
      {comanda.customer_name && (
        <span className="text-white text-sm font-medium w-full">
          {comanda.customer_name}
        </span>
      )}
    </button>
  );
};

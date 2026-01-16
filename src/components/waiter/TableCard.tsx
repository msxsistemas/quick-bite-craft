import { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Clock } from 'lucide-react';
import { Table } from '@/hooks/useTables';

interface TableCardProps {
  table: Table;
  hasPendingOrder: boolean;
  occupiedSince?: Date | null;
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

export const TableCard = ({ table, hasPendingOrder, occupiedSince, onClick }: TableCardProps) => {
  const [occupationTime, setOccupationTime] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStatus, setPrevStatus] = useState(table.status);

  const isOccupied = table.status === 'occupied';
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

  // Update occupation time every minute
  useEffect(() => {
    if (!occupiedSince || table.status === 'free') {
      setOccupationTime('');
      return;
    }

    const updateTime = () => {
      setOccupationTime(formatOccupationTime(occupiedSince));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [occupiedSince, table.status]);

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
        min-h-[72px] rounded-md p-3 border-l-4 flex flex-col justify-start items-start text-left 
        transition-all duration-300 ease-out hover:opacity-90 relative gap-1
        ${getBgColor()} ${getBorderColor()}
        ${isAnimating ? 'animate-scale-in' : ''}
      `}
    >
      <div className="flex items-start justify-between w-full">
        <div className="flex flex-col">
          <span className="text-cyan-400 text-[10px] font-medium uppercase">Mesa</span>
          <span className="text-white font-bold text-lg leading-tight">{table.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasPendingOrder && (
            <div className="text-white/80">
              <ShoppingCart className="w-4 h-4" />
            </div>
          )}
          {/* Occupation time indicator */}
          {(isOccupied || isRequesting) && occupationTime && (
            <div className="flex items-center gap-1 text-white/90">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-medium">{occupationTime}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

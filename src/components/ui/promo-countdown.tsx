import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface PromoCountdownProps {
  expiresAt: string;
  variant?: 'light' | 'dark' | 'inline';
  className?: string;
}

export const PromoCountdown = ({ expiresAt, variant = 'light', className = '' }: PromoCountdownProps) => {
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
        setTimeLeft('Expirada');
        return;
      }

      // Mark as urgent if less than 24 hours
      setIsUrgent(diff < 24 * 60 * 60 * 1000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    };

    calculateTimeLeft();
    // Update every second for urgent timers, every minute otherwise
    const interval = setInterval(calculateTimeLeft, isUrgent ? 1000 : 60000);

    return () => clearInterval(interval);
  }, [expiresAt, isUrgent]);

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs ${
        isExpired ? 'text-red-500' : isUrgent ? 'text-orange-500 animate-pulse' : 'text-orange-400'
      } ${className}`}>
        <Clock className="w-3 h-3" />
        <span>{timeLeft}</span>
      </span>
    );
  }

  const baseStyles = variant === 'dark' 
    ? `${isExpired ? 'bg-red-500/20 text-red-400' : isUrgent ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-400'}`
    : `${isExpired ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-orange-50 text-orange-500'}`;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${baseStyles} ${isUrgent && !isExpired ? 'animate-pulse' : ''} ${className}`}>
      <Clock className="w-3 h-3" />
      <span>{isExpired ? 'Expirada' : `Termina em ${timeLeft}`}</span>
    </div>
  );
};
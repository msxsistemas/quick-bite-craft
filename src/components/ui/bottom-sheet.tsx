import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  showCloseButton?: boolean;
}

interface BottomSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

interface BottomSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-none',
};

export function BottomSheet({
  open,
  onClose,
  children,
  className,
  maxWidth = 'full',
  showCloseButton = true,
}: BottomSheetProps) {
  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-2 pb-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={cn(
          "w-[99%] bg-background rounded-2xl animate-in slide-in-from-bottom duration-300 flex flex-col",
          maxWidthClasses[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<BottomSheetHeaderProps>(child) && child.type === BottomSheetHeader) {
            return React.cloneElement(child, {
              onClose,
              showCloseButton,
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}

export function BottomSheetHeader({
  children,
  className,
  onClose,
  showCloseButton = true,
}: BottomSheetHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b border-border flex-shrink-0", className)}>
      <div className="flex-1">{children}</div>
      {showCloseButton && onClose && (
        <button 
          onClick={onClose}
          className="p-1 hover:bg-muted rounded transition-colors ml-2"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export function BottomSheetContent({
  children,
  className,
}: BottomSheetContentProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  );
}

export function BottomSheetFooter({
  children,
  className,
}: BottomSheetFooterProps) {
  return (
    <div className={cn("p-4 border-t border-border flex-shrink-0", className)}>
      {children}
    </div>
  );
}

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  isExiting?: boolean;
}

interface WaiterToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const WaiterToastContext = createContext<WaiterToastContextType | null>(null);

export const useWaiterToast = () => {
  const context = useContext(WaiterToastContext);
  if (!context) {
    return {
      showToast: (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        console.log(`[Toast ${type}]:`, message);
      }
    };
  }
  return context;
};

interface WaiterToastProviderProps {
  children: ReactNode;
}

const TOAST_DURATION = 3000;

export const WaiterToastProvider = ({ children }: WaiterToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, isExiting: false }]);
  };

  const removeToast = (id: string) => {
    // Start exit animation
    setToasts(prev => prev.map(t => t.id === id ? { ...t, isExiting: true } : t));
    // Remove after animation
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300);
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const oldestToast = toasts.find(t => !t.isExiting);
      if (oldestToast) {
        const timer = setTimeout(() => {
          removeToast(oldestToast.id);
        }, TOAST_DURATION);
        return () => clearTimeout(timer);
      }
    }
  }, [toasts]);

  const getProgressColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <WaiterToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-2 px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex flex-col bg-slate-800 border border-slate-700 rounded-lg shadow-lg mb-2 min-w-[200px] max-w-[90vw] overflow-hidden
              ${toast.isExiting ? 'animate-fade-out' : 'animate-fade-in'}
            `}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {toast.type === 'success' && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {toast.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
              {toast.type === 'info' && (
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
              <span className="text-white font-medium text-sm flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-slate-700 rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            {/* Progress bar */}
            {!toast.isExiting && (
              <div className="h-1 w-full bg-slate-700">
                <div 
                  className={`h-full ${getProgressColor(toast.type)} animate-shrink-width`}
                  style={{ 
                    animation: `shrink-width ${TOAST_DURATION}ms linear forwards`
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keyframes for progress bar */}
      <style>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </WaiterToastContext.Provider>
  );
};

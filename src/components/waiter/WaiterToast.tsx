import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, Check, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface WaiterToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const WaiterToastContext = createContext<WaiterToastContextType | null>(null);

export const useWaiterToast = () => {
  const context = useContext(WaiterToastContext);
  if (!context) {
    // Return a fallback that uses regular toast
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

export const WaiterToastProvider = ({ children }: WaiterToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return (
    <WaiterToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center justify-between px-4 py-3 text-white animate-in slide-in-from-top duration-300
              ${toast.type === 'success' ? 'bg-green-500' : ''}
              ${toast.type === 'error' ? 'bg-red-500' : ''}
              ${toast.type === 'info' ? 'bg-blue-500' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && <Check className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
              <span className="font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </WaiterToastContext.Provider>
  );
};

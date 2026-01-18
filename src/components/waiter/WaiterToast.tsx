import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  return (
    <WaiterToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center pt-2 px-4 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top duration-300 mb-2 min-w-[200px] max-w-[90vw]"
          >
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
        ))}
      </div>
    </WaiterToastContext.Provider>
  );
};

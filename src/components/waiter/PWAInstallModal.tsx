import { useState, useEffect } from 'react';
import { X, Share, Plus, Smartphone, MoreVertical } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  appIcon?: string;
}

export const PWAInstallModal = ({ isOpen, onClose, appName = 'App do Garçom', appIcon }: PWAInstallModalProps) => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
  }, []);

  if (!isOpen) return null;

  const AppIcon = () => appIcon ? (
    <img src={appIcon} alt={appName} className="w-10 h-10 rounded-xl object-cover" />
  ) : (
    <div className="w-10 h-10 bg-[#1e4976] rounded-xl flex items-center justify-center">
      <Smartphone className="w-5 h-5 text-cyan-400" />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Instale o aplicativo</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* App Info */}
        <div className="px-5 py-4">
          <div className="p-4 bg-[#f8f5f0] rounded-2xl">
            <div className="flex items-center gap-4">
              <AppIcon />
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-semibold text-base truncate">{appName}</p>
                <p className="text-gray-500 text-sm truncate">{window.location.hostname}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-5 pb-6 space-y-5">
          {isIOS ? (
            <>
              {/* iOS Instructions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">1. Toque no</span>
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg">
                  <Share className="w-4 h-4 text-gray-600" />
                </span>
                <span className="text-gray-800 text-sm">no menu do navegador</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">2. Role e selecione</span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                  Adicionar à Tela de início
                  <Plus className="w-4 h-4 text-gray-500" />
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">3. Procure o ícone</span>
                <AppIcon />
                <span className="text-gray-800 text-sm">na tela inicial</span>
              </div>
            </>
          ) : (
            <>
              {/* Android/Desktop Instructions */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">1. Toque no</span>
                <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 border border-gray-200 rounded-lg">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </span>
                <span className="text-gray-800 text-sm">no menu do navegador</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">2. Role e selecione</span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700">
                  Adicionar à Tela de início
                  <Plus className="w-4 h-4 text-gray-500" />
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-800 text-sm font-medium">3. Procure o ícone</span>
                <AppIcon />
                <span className="text-gray-800 text-sm">na tela inicial</span>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scale-in {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

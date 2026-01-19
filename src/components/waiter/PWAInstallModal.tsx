import { useState, useEffect } from 'react';
import { X, Share, Plus, Smartphone, MoreVertical, Download, User } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#f5f0e8] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-base font-medium text-gray-900">Instale o aplicativo</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* App Info */}
        <div className="px-4 pb-4">
          <div className="p-3 bg-[#ebe6de] rounded-xl">
            <div className="flex items-center gap-3">
              {appIcon ? (
                <img src={appIcon} alt={appName} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 bg-[#1e4976] rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                </div>
              )}
              <div>
                <p className="text-gray-900 font-medium text-sm">{appName}</p>
                <p className="text-gray-500 text-xs">{window.location.hostname}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-4 pb-4 space-y-3">
          {isIOS ? (
            <>
              {/* iOS Instructions */}
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm">1. Toque no</span>
                <span className="inline-flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-md">
                  <Share className="w-4 h-4 text-gray-600" />
                </span>
                <span className="text-gray-700 text-sm">no menu do navegador</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700 text-sm">2. Role e selecione</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                  Adicionar à Tela de início
                  <Plus className="w-4 h-4 text-gray-500" />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm">3. Procure o ícone</span>
                {appIcon ? (
                  <img src={appIcon} alt={appName} className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 bg-[#1e4976] rounded-lg flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <span className="text-gray-700 text-sm">na tela inicial</span>
              </div>
            </>
          ) : (
            <>
              {/* Android/Desktop Instructions */}
              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm">1. Toque no</span>
                <span className="inline-flex items-center justify-center w-7 h-7 bg-white border border-gray-200 rounded-md">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </span>
                <span className="text-gray-700 text-sm">no menu do navegador</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gray-700 text-sm">2. Role e selecione</span>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700">
                  Adicionar à Tela de início
                  <Plus className="w-4 h-4 text-gray-500" />
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-gray-700 text-sm">3. Procure o ícone</span>
                {appIcon ? (
                  <img src={appIcon} alt={appName} className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 bg-[#1e4976] rounded-lg flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <span className="text-gray-700 text-sm">na tela inicial</span>
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

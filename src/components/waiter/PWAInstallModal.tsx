import { useState, useEffect } from 'react';
import { X, Share, Plus, Smartphone, MoreVertical, Download } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  appIcon?: string;
}

export const PWAInstallModal = ({ isOpen, onClose, appName = 'App do Garçom', appIcon }: PWAInstallModalProps) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    setIsAndroid(/Android/.test(userAgent));
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
      <div className="relative w-full max-w-md bg-[#0d2847] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up sm:animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Instale o aplicativo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* App Info */}
        <div className="p-4 mx-4 mt-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-4">
            {appIcon ? (
              <img src={appIcon} alt={appName} className="w-14 h-14 rounded-xl object-cover" />
            ) : (
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
            )}
            <div>
              <p className="text-white font-semibold text-base">{appName}</p>
              <p className="text-white/50 text-sm">{window.location.hostname}</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-4 space-y-4">
          {isIOS ? (
            <>
              {/* iOS Instructions */}
              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Toque no{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md mx-1">
                      <Share className="w-4 h-4 text-blue-400" />
                    </span>
                    {' '}no menu do navegador
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Role e selecione{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md mx-1">
                      Adicionar à Tela de Início
                      <Plus className="w-4 h-4 text-blue-400" />
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <p className="text-white text-sm">
                    Procure o ícone{' '}
                  </p>
                  {appIcon ? (
                    <img src={appIcon} alt={appName} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className="text-white text-sm">
                    na tela inicial
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Android/Desktop Instructions */}
              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Toque no menu{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md mx-1">
                      <MoreVertical className="w-4 h-4 text-blue-400" />
                    </span>
                    {' '}do navegador
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm">
                    Selecione{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md mx-1">
                      <Download className="w-4 h-4 text-blue-400" />
                      Instalar aplicativo
                    </span>
                    {' '}ou{' '}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded-md mx-1">
                      <Plus className="w-4 h-4 text-blue-400" />
                      Adicionar à tela inicial
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full text-white font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <p className="text-white text-sm">
                    Procure o ícone{' '}
                  </p>
                  {appIcon ? (
                    <img src={appIcon} alt={appName} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <p className="text-white text-sm">
                    na tela inicial
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors"
          >
            Entendi
          </button>
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

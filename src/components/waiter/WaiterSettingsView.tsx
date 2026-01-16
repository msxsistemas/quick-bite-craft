import { ArrowLeft, Bell, Printer, Volume2, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { Switch } from '@/components/ui/switch';

interface WaiterSettingsViewProps {
  onBack: () => void;
  restaurantName?: string;
}

export const WaiterSettingsView = ({ onBack, restaurantName }: WaiterSettingsViewProps) => {
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-lg">Configurações</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Restaurant Info */}
        <div className="bg-[#0d2847] border border-[#1e4976] rounded-xl p-4">
          <h2 className="text-white font-semibold mb-2">Restaurante</h2>
          <p className="text-slate-400">{restaurantName || 'Não definido'}</p>
        </div>

        {/* Notification Settings */}
        <div className="bg-[#0d2847] border border-[#1e4976] rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Notificações</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white">Notificações</p>
                <p className="text-sm text-slate-400">Receber alertas de novos pedidos</p>
              </div>
            </div>
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white">Som</p>
                <p className="text-sm text-slate-400">Tocar som ao receber pedido</p>
              </div>
            </div>
            <Switch 
              checked={sound} 
              onCheckedChange={setSound}
            />
          </div>
        </div>

        {/* Print Settings */}
        <div className="bg-[#0d2847] border border-[#1e4976] rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Impressão</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Printer className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-white">Impressão automática</p>
                <p className="text-sm text-slate-400">Imprimir pedidos automaticamente</p>
              </div>
            </div>
            <Switch 
              checked={autoPrint} 
              onCheckedChange={setAutoPrint}
            />
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-[#0d2847] border border-[#1e4976] rounded-xl p-4 space-y-4">
          <h2 className="text-white font-semibold">Aparência</h2>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-cyan-400" />
              ) : (
                <Sun className="w-5 h-5 text-cyan-400" />
              )}
              <div>
                <p className="text-white">Modo escuro</p>
                <p className="text-sm text-slate-400">Usar tema escuro</p>
              </div>
            </div>
            <Switch 
              checked={darkMode} 
              onCheckedChange={setDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

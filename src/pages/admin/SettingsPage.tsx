import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Store, 
  Settings, 
  Palette, 
  MapPin, 
  Phone, 
  CreditCard, 
  Send, 
  Clock,
  ChevronDown,
  X,
  CheckSquare,
  Truck,
  Package
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DaySchedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

const SettingsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  
  // Store Status
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Branding
  const [restaurantName, setRestaurantName] = useState('Burger House Gourmet');
  const [appName, setAppName] = useState('Cardápio');
  const [shortName, setShortName] = useState('Cardápio');
  
  // Address & Contact
  const [address, setAddress] = useState('Rua das Hamburguesas, 1234 - Centro, São Paulo - SP');
  const [whatsapp, setWhatsapp] = useState('11999887766');
  
  // PIX
  const [pixKeyType, setPixKeyType] = useState('phone');
  const [pixKey, setPixKey] = useState('11999887766');
  
  // WhatsApp Messages
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  
  // Schedule
  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { id: 1, day: 'Domingo', startTime: '18:00', endTime: '23:00', active: true },
    { id: 2, day: 'Segunda', startTime: '11:30', endTime: '14:30', active: true },
    { id: 3, day: 'Terça', startTime: '12:30', endTime: '14:30', active: true },
    { id: 4, day: 'Quarta', startTime: '11:30', endTime: '22:30', active: true },
    { id: 5, day: 'Quinta', startTime: '11:30', endTime: '23:00', active: true },
    { id: 6, day: 'Sexta', startTime: '11:30', endTime: '00:00', active: true },
    { id: 7, day: 'Sábado', startTime: '03:30', endTime: '10:00', active: true },
  ]);

  const whatsappMessages = [
    { id: 'pix', label: 'Cobrança PIX', icon: CreditCard },
    { id: 'accepted', label: 'Pedido Aceito', icon: CheckSquare },
    { id: 'delivery', label: 'Saiu para Entrega', icon: Truck },
    { id: 'delivered', label: 'Pedido Entregue', icon: Package },
  ];

  const toggleDayActive = (id: number) => {
    setSchedule(prev =>
      prev.map(day => day.id === id ? { ...day, active: !day.active } : day)
    );
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-8 max-w-2xl">
        {/* Store Status Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Status da Loja</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    isStoreOpen 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isStoreOpen ? 'Aberta' : 'Fechada'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Sincronizado com horários de funcionamento</p>
              </div>
            </div>
            <Switch
              checked={isStoreOpen}
              onCheckedChange={setIsStoreOpen}
            />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm font-medium text-foreground">Modo Manual</span>
                <p className="text-xs text-muted-foreground">Ativar para abrir/fechar manualmente</p>
              </div>
            </div>
            <Switch
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
          </div>

          <p className="text-sm text-muted-foreground px-4">
            Hoje (Segunda): 11:30 - 14:30
          </p>
        </div>

        {/* Branding Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Personalização da Marca</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Nome do Restaurante</label>
              <input
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Logo (também será o ícone do app instalado)</label>
              <div className="relative">
                <div className="w-full h-40 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg flex items-center justify-center overflow-hidden">
                  <span className="text-6xl">🍔</span>
                </div>
                <button className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Recomendado: imagem quadrada de pelo menos 512x512 pixels</p>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Preview</label>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-800 to-amber-950 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🍔</span>
                </div>
                <span className="font-semibold text-foreground">{restaurantName}</span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-4">Configurações do App Instalável (PWA)</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Nome do App (exibido na tela inicial)</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Nome Curto (abaixo do ícone)</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Aparece abaixo do ícone quando o app é instalado</p>
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
              Salvar Personalização
            </button>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Endereço</h2>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Endereço completo</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-muted-foreground mt-1">Será exibido no cardápio para os clientes</p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Contato</h2>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">WhatsApp</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-xs text-muted-foreground mt-1">Apenas números, com DDD</p>
          </div>
        </div>

        {/* PIX Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-foreground">Chave PIX</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Tipo da Chave</label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="cpf">CPF</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="random">Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Chave PIX</label>
              <input
                type="text"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Messages Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Mensagens WhatsApp por Fase</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure mensagens personalizadas para enviar ao cliente em cada fase do pedido via WhatsApp.
          </p>

          <div className="space-y-2">
            {whatsappMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <message.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{message.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                  expandedMessage === message.id ? 'rotate-180' : ''
                }`} />
              </button>
            ))}
          </div>

          <button className="w-full py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
            Salvar Configurações
          </button>
        </div>

        {/* Operating Hours Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Horários de Funcionamento</h2>
          </div>

          <div className="space-y-2">
            {schedule.map((day) => (
              <div
                key={day.id}
                className="flex items-center justify-between p-4 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={day.active}
                    onCheckedChange={() => toggleDayActive(day.id)}
                    className="data-[state=checked]:bg-amber-500"
                  />
                  <span className="font-medium text-foreground">{day.day}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {day.startTime} - {day.endTime}
                  </span>
                  <button className="text-sm font-medium text-foreground hover:text-amber-600 transition-colors">
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SettingsPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  ExternalLink, 
  Settings, 
  CreditCard, 
  Calendar, 
  Users, 
  Store,
  AlertCircle,
  Phone,
  History,
  MessageSquare,
  Loader2
} from 'lucide-react';

interface RestaurantWithSubscription {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  created_at: string;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  subscription?: {
    id: string;
    status: string;
    monthly_fee: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };
}

interface RestaurantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurant: RestaurantWithSubscription | null;
  onStatusChange?: (restaurantId: string, newStatus: string) => Promise<void>;
}

export function RestaurantDetailsModal({ 
  isOpen, 
  onClose, 
  restaurant,
  onStatusChange 
}: RestaurantDetailsModalProps) {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(restaurant?.subscription?.status || 'trial');
  const [isSaving, setIsSaving] = useState(false);

  // Update local state when restaurant changes
  useEffect(() => {
    if (restaurant) {
      setSubscriptionStatus(restaurant.subscription?.status || 'trial');
    }
  }, [restaurant]);

  if (!restaurant || !isOpen) return null;

  const handleStatusChange = async (newStatus: string) => {
    setSubscriptionStatus(newStatus);
    if (onStatusChange) {
      setIsSaving(true);
      try {
        await onStatusChange(restaurant.id, newStatus);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trial': return 'Período de Teste';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Atrasado';
      case 'cancelled': return 'Cancelado';
      default: return 'Período de Teste';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[1vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[99%] max-w-4xl bg-background rounded-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{restaurant.name}</h2>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    restaurant.subscription?.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : restaurant.subscription?.status === 'pending'
                      ? 'bg-amber-100 text-amber-700'
                      : restaurant.subscription?.status === 'overdue'
                      ? 'bg-red-100 text-red-700'
                      : restaurant.subscription?.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {restaurant.subscription?.status === 'active' ? 'Ativo' 
                      : restaurant.subscription?.status === 'pending' ? 'Pendente'
                      : restaurant.subscription?.status === 'overdue' ? 'Atrasado'
                      : restaurant.subscription?.status === 'cancelled' ? 'Cancelado'
                      : 'Teste'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.open(`/${restaurant.slug}`, '_blank')}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Ver Cardápio
              </button>
              <button
                onClick={() => navigate(`/r/${restaurant.slug}/admin/dashboard`)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Acessar Painel
              </button>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-border">
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mensalidade</p>
              <p className="font-semibold">R$ {(restaurant.subscription?.monthly_fee || 0).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-semibold">{new Date(restaurant.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="font-semibold">1</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loja</p>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  restaurant.subscription?.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : restaurant.subscription?.status === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : restaurant.subscription?.status === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : restaurant.subscription?.status === 'cancelled'
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {restaurant.subscription?.status === 'active' ? 'Ativa' 
                    : restaurant.subscription?.status === 'pending' ? 'Pendente'
                    : restaurant.subscription?.status === 'overdue' ? 'Atrasado'
                    : restaurant.subscription?.status === 'cancelled' ? 'Cancelado'
                    : 'Teste'}
                </span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  restaurant.is_open
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {restaurant.is_open ? 'Aberta' : 'Fechada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <Tabs defaultValue="billing" className="w-full">
            <TabsList className="bg-muted p-1 rounded-lg mb-6">
              <TabsTrigger value="billing" className="rounded-md px-4 py-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cobrança
              </TabsTrigger>
              <TabsTrigger value="contact" className="rounded-md px-4 py-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-md px-4 py-2 flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="admins" className="rounded-md px-4 py-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Administradores
              </TabsTrigger>
              <TabsTrigger value="communications" className="rounded-md px-4 py-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comunicações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-6">
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5" />
                  Cobrança
                </h3>

                {/* Warning */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-700">
                      O Mercado Pago não está configurado. Configure em{' '}
                      <span className="font-medium text-primary cursor-pointer hover:underline">
                        Configurações
                      </span>
                      {' → '}
                      <span className="font-medium text-primary cursor-pointer hover:underline">
                        Mercado Pago
                      </span>
                      {' '}para gerar cobranças automáticas.
                    </p>
                  </div>
                </div>

                {/* Manual Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    Gerenciar Status Manualmente
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  </label>
                  <Select 
                    value={subscriptionStatus} 
                    onValueChange={handleStatusChange}
                    disabled={isSaving}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Período de Teste</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Telefone</label>
                    <p className="font-medium">{restaurant.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">WhatsApp</label>
                    <p className="font-medium">{restaurant.whatsapp || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Endereço</label>
                    <p className="font-medium">{restaurant.address || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento registrado
                </div>
              </div>
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Administradores</h3>
                <div className="text-center py-8 text-muted-foreground">
                  Funcionalidade em desenvolvimento
                </div>
              </div>
            </TabsContent>

            <TabsContent value="communications" className="space-y-6">
              <div className="border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Comunicações</h3>
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma comunicação enviada
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

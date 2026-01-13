import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RestaurantDetails {
  id: string;
  name: string;
  slug: string;
  is_open: boolean;
  created_at: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  subscription?: {
    id: string;
    status: string;
    monthly_fee: number;
    trial_ends_at: string | null;
    current_period_end: string | null;
  };
}

const RestaurantDetailsPage = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId || !user) return;

      try {
        // Fetch restaurant
        const { data: restaurantData, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .eq('reseller_id', user.id)
          .maybeSingle();

        if (restaurantError) throw restaurantError;

        if (!restaurantData) {
          toast.error('Restaurante não encontrado');
          navigate('/reseller/restaurants');
          return;
        }

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('restaurant_subscriptions')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        const restaurantWithSub: RestaurantDetails = {
          ...restaurantData,
          subscription: subscriptionData ? {
            id: subscriptionData.id,
            status: subscriptionData.status,
            monthly_fee: Number(subscriptionData.monthly_fee),
            trial_ends_at: subscriptionData.trial_ends_at,
            current_period_end: subscriptionData.current_period_end,
          } : undefined,
        };

        setRestaurant(restaurantWithSub);
        setSubscriptionStatus(subscriptionData?.status || 'trial');
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error('Erro ao carregar restaurante');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId, user, navigate]);

  const handleStatusChange = async (newStatus: string) => {
    if (!restaurant) return;

    setIsSaving(true);
    try {
      if (restaurant.subscription?.id) {
        // Update existing subscription
        const { error } = await supabase
          .from('restaurant_subscriptions')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', restaurant.subscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from('restaurant_subscriptions')
          .insert({
            restaurant_id: restaurant.id,
            status: newStatus,
            monthly_fee: 99.90,
          });

        if (error) throw error;
      }

      setSubscriptionStatus(newStatus);
      toast.success('Status da assinatura atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating subscription status:', error);
      toast.error('Erro ao atualizar status da assinatura');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout type="reseller">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!restaurant) {
    return (
      <AdminLayout type="reseller">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Restaurante não encontrado</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/reseller/restaurants')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{restaurant.name}</h1>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {subscriptionStatus === 'active' ? 'Ativo' : 'Teste'}
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
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mensalidade</p>
              <p className="font-semibold">R$ {(restaurant.subscription?.monthly_fee || 99.90).toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Início</p>
              <p className="font-semibold">{new Date(restaurant.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admins</p>
              <p className="font-semibold">1</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-border rounded-xl bg-card">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loja</p>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  subscriptionStatus === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {subscriptionStatus === 'active' ? 'Ativa' : 'Teste'}
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
        <Tabs defaultValue="billing" className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg">
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

          <TabsContent value="billing" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
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
                    <span 
                      className="font-medium text-primary cursor-pointer hover:underline"
                      onClick={() => navigate('/reseller/settings')}
                    >
                      Configurações
                    </span>
                    {' → '}
                    <span className="font-medium text-primary">
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
                    <SelectItem value="suspended">Suspenso</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
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

          <TabsContent value="history" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Histórico de Pagamentos</h3>
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pagamento registrado
              </div>
            </div>
          </TabsContent>

          <TabsContent value="admins" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Administradores</h3>
              <div className="text-center py-8 text-muted-foreground">
                Funcionalidade em desenvolvimento
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communications" className="mt-6 space-y-6">
            <div className="border border-border rounded-xl p-6 bg-card">
              <h3 className="text-lg font-semibold mb-4">Comunicações</h3>
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma comunicação enviada
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default RestaurantDetailsPage;

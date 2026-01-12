import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, DollarSign, Clock, AlertTriangle, Plus, MoreVertical, Calendar, CreditCard, ArrowRight, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CreateRestaurantModal } from '@/components/reseller/CreateRestaurantModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Tables } from '@/integrations/supabase/types';

type Restaurant = Tables<'restaurants'>;

interface RestaurantWithPlan extends Restaurant {
  plan_status: 'trial' | 'active';
  monthly_fee: number;
  created_date: string;
}

const ResellerDashboard = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantWithPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRestaurants = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('reseller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add mock plan data
      const restaurantsWithPlan: RestaurantWithPlan[] = (data || []).map((r, index) => ({
        ...r,
        plan_status: index === 0 ? 'active' : 'trial',
        monthly_fee: index === 0 ? 149.90 : 99.90,
        created_date: new Date(r.created_at).toLocaleDateString('pt-BR'),
      }));
      
      setRestaurants(restaurantsWithPlan);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, [user]);

  const activeRestaurants = restaurants.filter(r => r.plan_status === 'active');
  const trialRestaurants = restaurants.filter(r => r.plan_status === 'trial');
  const monthlyRevenue = activeRestaurants.reduce((sum, r) => sum + r.monthly_fee, 0);

  const stats = [
    { 
      label: 'Total de Restaurantes', 
      value: restaurants.length.toString(), 
      subtext: `${activeRestaurants.length} ativos`,
      icon: Store, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'Receita Mensal', 
      value: `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`, 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      label: 'Em Período de Teste', 
      value: trialRestaurants.length.toString(), 
      icon: Clock, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      label: 'Pagamentos Pendentes', 
      value: '0', 
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-600' 
    },
  ];

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral dos seus restaurantes</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Restaurante
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="rounded-md px-4 py-2">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial" className="rounded-md px-4 py-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="delivery-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      {stat.subtext && (
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.subtext}</p>
                      )}
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Restaurants */}
              <div className="delivery-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Restaurantes Recentes</h2>
                  <button 
                    onClick={() => navigate('/reseller/restaurants')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver todos
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : restaurants.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Store className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Nenhum restaurante cadastrado</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {restaurants.slice(0, 3).map((restaurant) => (
                      <div key={restaurant.id} className="border border-border rounded-xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Store className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
                              <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                                restaurant.is_open 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-red-100 text-red-600'
                              }`}>
                                {restaurant.is_open ? 'Aberto' : 'Fechado'}
                              </span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 hover:bg-muted rounded">
                              <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mb-4">
                          <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                            restaurant.plan_status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-primary text-primary-foreground'
                          }`}>
                            {restaurant.plan_status === 'active' ? 'Ativo' : 'Período de Teste'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4" />
                            <span>R$ {restaurant.monthly_fee.toFixed(2).replace('.', ',')}/mês</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{restaurant.created_date}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {}}
                            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            Ver detalhes
                          </button>
                          <button
                            onClick={() => navigate(`/r/${restaurant.slug}/admin/dashboard`)}
                            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
                          >
                            Acessar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Payments */}
              <div className="delivery-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Pagamentos Pendentes</h2>
                  <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Ver todos
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Nenhum pagamento pendente</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="mt-6">
            <div className="delivery-card p-12 text-center">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Relatórios financeiros em breve</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreateRestaurantModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchRestaurants}
      />
    </AdminLayout>
  );
};

export default ResellerDashboard;

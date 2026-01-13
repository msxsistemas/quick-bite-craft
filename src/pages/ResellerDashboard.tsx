import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, DollarSign, Clock, AlertTriangle, Plus, MoreVertical, Calendar, CreditCard, ArrowRight, BarChart3, TrendingUp, Percent, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CreateRestaurantModal } from '@/components/reseller/CreateRestaurantModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRestaurantSubscriptions } from '@/hooks/useRestaurantSubscriptions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
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
  const { restaurants: subscriptionRestaurants, payments, getStats } = useRestaurantSubscriptions();

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

  const stats = getStats();
  const activeRestaurants = restaurants.filter(r => r.plan_status === 'active');
  const trialRestaurants = restaurants.filter(r => r.plan_status === 'trial');
  const monthlyRevenue = stats.monthlyRevenue;

  // Financial data
  const currentMonth = new Date().getMonth();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  // Generate monthly revenue data
  const revenueData = months.map((month, index) => {
    const isPast = index <= currentMonth;
    const isFuture = index > currentMonth;
    return {
      month,
      revenue: isPast ? (index === currentMonth ? monthlyRevenue : Math.random() * monthlyRevenue * 0.8) : null,
      forecast: isFuture ? monthlyRevenue * (1 + (index - currentMonth) * 0.1) : null,
    };
  });

  // Revenue by month bar chart data
  const revenueByMonth = months.slice(0, currentMonth + 1).map((month, index) => ({
    month,
    revenue: index === currentMonth ? monthlyRevenue : Math.random() * monthlyRevenue * 0.8,
  }));

  // Subscription distribution data
  const subscriptionDistribution = [
    { name: 'Ativos', value: stats.activeSubscriptions, fill: '#F97316' },
    { name: 'Trial', value: stats.trialSubscriptions || trialRestaurants.length, fill: '#1F2937' },
  ];

  // Calculate 3 month forecast
  const threeMonthForecast = monthlyRevenue * 3 * 1.1;

  // Calculate default rate (overdue / total)
  const defaultRate = payments.length > 0 
    ? ((stats.overduePayments / payments.length) * 100).toFixed(1) 
    : '0.0';

  // Current month payments
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.due_date);
    const now = new Date();
    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear();
  });

  const overviewStats = [
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
      value: stats.pendingPayments.toString(), 
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
              {overviewStats.map((stat) => (
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

          <TabsContent value="financial" className="mt-6 space-y-6">
            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="delivery-card p-6">
                <p className="text-sm text-muted-foreground">Receita este Mês</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  R$ {monthlyRevenue.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="delivery-card p-6">
                <p className="text-sm text-muted-foreground">Previsão 3 Meses</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  R$ {threeMonthForecast.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div className="delivery-card p-6">
                <p className="text-sm text-muted-foreground">Taxa de Inadimplência</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {defaultRate}%
                </p>
              </div>
              <div className="delivery-card p-6">
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {stats.activeSubscriptions}
                </p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue + Forecast Chart */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Receita Mensal + Previsão</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, '']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#1F2937" 
                        strokeWidth={2}
                        dot={{ fill: '#1F2937', r: 4 }}
                        connectNulls={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="forecast" 
                        stroke="#9CA3AF" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#9CA3AF', r: 4 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Month Bar Chart */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Receita por Mês</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2).replace('.', ',')}`, 'Receita']}
                      />
                      <Bar dataKey="revenue" fill="#1F2937" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Distribution */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Assinaturas</h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={subscriptionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {subscriptionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Status */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Status de Pagamentos (Mês Atual)</h3>
                {currentMonthPayments.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Nenhum pagamento registrado este mês</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {currentMonthPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {new Date(payment.due_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">R$ {payment.amount.toFixed(2).replace('.', ',')}</p>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-700'
                              : payment.status === 'overdue'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {payment.status === 'paid' ? 'Pago' : payment.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

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
  AreaChart,
  Area,
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
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  
  // Calculate real revenue per month from payments
  const getMonthlyRevenueData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    // Initialize all months of the year with 0
    months.forEach((month, index) => {
      monthlyData[`${currentYear}-${index}`] = 0;
    });
    
    // Sum paid payments by month
    payments.forEach(payment => {
      if (payment.status === 'paid' && payment.paid_at) {
        const paidDate = new Date(payment.paid_at);
        const key = `${paidDate.getFullYear()}-${paidDate.getMonth()}`;
        if (monthlyData[key] !== undefined) {
          monthlyData[key] += payment.amount;
        }
      }
    });
    
    return months.map((month, index) => ({
      month,
      revenue: monthlyData[`${currentYear}-${index}`] || 0,
      isPast: index <= currentMonth,
    }));
  };

  const monthlyRevenueData = getMonthlyRevenueData();

  // Generate revenue + forecast data
  const revenueData = months.map((month, index) => {
    const actualRevenue = monthlyRevenueData[index]?.revenue || 0;
    const isPast = index <= currentMonth;
    const isFuture = index > currentMonth;
    
    // For forecast, use average of past months or current monthly_fee * active subscriptions
    const avgRevenue = monthlyRevenue > 0 ? monthlyRevenue : 
      stats.activeSubscriptions * 99.90;
    
    return {
      month,
      revenue: isPast ? actualRevenue : null,
      forecast: isFuture ? avgRevenue * (1 + (index - currentMonth) * 0.05) : null,
    };
  });

  // Revenue by month bar chart data (last 6 months including current)
  const getRevenueByMonth = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const year = i > currentMonth ? currentYear - 1 : currentYear;
      
      // Sum paid payments for this month
      const monthRevenue = payments
        .filter(p => {
          if (p.status === 'paid' && p.paid_at) {
            const paidDate = new Date(p.paid_at);
            return paidDate.getMonth() === monthIndex && paidDate.getFullYear() === year;
          }
          return false;
        })
        .reduce((sum, p) => sum + p.amount, 0);
      
      data.push({
        month: months[monthIndex],
        revenue: monthRevenue,
      });
    }
    return data;
  };

  const revenueByMonth = getRevenueByMonth();

  // Subscription distribution data - real counts
  const subscriptionDistribution = [
    { name: 'Ativos', value: stats.activeSubscriptions, fill: '#F97316' },
    { name: 'Trial', value: stats.trialSubscriptions, fill: '#1F2937' },
  ].filter(item => item.value > 0);

  // Calculate 3 month forecast based on active subscriptions
  const threeMonthForecast = monthlyRevenue * 3 + (stats.trialSubscriptions * 99.90 * 2);

  // Calculate default rate (overdue / total paid + overdue)
  const totalPaymentsForRate = stats.overduePayments + payments.filter(p => p.status === 'paid').length;
  const defaultRate = totalPaymentsForRate > 0 
    ? ((stats.overduePayments / totalPaymentsForRate) * 100).toFixed(1) 
    : '0.0';

  // Current month payments
  const currentMonthPayments = payments.filter(p => {
    const paymentDate = new Date(p.due_date);
    return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
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
                            onClick={() => navigate(`/reseller/restaurants/${restaurant.id}`)}
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
              {/* Revenue Area Chart */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Receita Mensal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                        tickFormatter={(value) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                        axisLine={false}
                        tickLine={false}
                        width={80}
                      />
                      <Tooltip 
                        formatter={(value: number) => [
                          `R$ ${value?.toFixed(2).replace('.', ',') || '0,00'}`, 
                          'Receita'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                        dot={{ fill: '#3B82F6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                      />
                    </AreaChart>
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
                  <div className="space-y-3 max-h-64 overflow-y-auto">
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

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Distribution */}
              <div className="delivery-card p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição de Assinaturas</h3>
                <div className="h-64 flex items-center justify-center">
                  {subscriptionDistribution.length === 0 || subscriptionDistribution.every(d => d.value === 0) ? (
                    <p className="text-muted-foreground">Nenhuma assinatura registrada</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={subscriptionDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                        >
                          {subscriptionDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string) => [value, name]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Ativos ({stats.activeSubscriptions})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-800" />
                    <span className="text-muted-foreground">Trial ({stats.trialSubscriptions})</span>
                  </div>
                </div>
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

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Clock, 
  ChefHat, 
  UtensilsCrossed, 
  Users, 
  DollarSign,
  ShoppingBag,
  Receipt,
  Timer,
  Truck,
  Store,
  TrendingUp,
  RefreshCw,
  Calendar,
  Flame,
  CreditCard,
  Zap,
  Package,
  ChevronDown,
  Check,
  Star,
  Smile,
  Loader2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useSuggestions, PeriodFilter } from '@/hooks/useSuggestions';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatCurrency } from '@/lib/format';

type DateFilter = 'today' | 'week' | 'month';

const dateFilterOptions: { value: DateFilter; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
];

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: '7days', label: '7 dias' },
  { value: '30days', label: '30 dias' },
  { value: '3months', label: '3 meses' },
];

const RestaurantDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [satisfactionPeriod, setSatisfactionPeriod] = useState<PeriodFilter>('7days');
  const { restaurant } = useRestaurantBySlug(slug);
  const { data: suggestionStats } = useSuggestions(restaurant?.id, satisfactionPeriod);
  const { data: stats, isLoading, refetch } = useDashboardStats(restaurant?.id, dateFilter);

  const ratingEmojis: Record<number, string> = {
    1: '😫',
    2: '🙁',
    3: '🙂',
    4: '😊',
    5: '🤩'
  };

  const statusCards = [
    { label: 'Aguardando', value: stats?.pendingOrders?.toString() || '0', icon: Clock, bgColor: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Na Cozinha', value: stats?.preparingOrders?.toString() || '0', icon: ChefHat, bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Mesas Abertas', value: stats?.openTables?.toString() || '0', icon: UtensilsCrossed, bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'Clientes Hoje', value: stats?.customersToday?.toString() || '0', icon: Users, bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  ];

  const financialCards = [
    { 
      label: 'Faturamento Total', 
      value: formatCurrency(stats?.totalRevenue || 0), 
      icon: DollarSign, 
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    { 
      label: 'Pedidos', 
      value: stats?.totalOrders?.toString() || '0', 
      icon: ShoppingBag, 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Ticket Médio', 
      value: formatCurrency(stats?.avgTicket || 0), 
      icon: Receipt, 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      label: 'Mesas Fechadas', 
      value: stats?.closedTables?.toString() || '0',
      icon: Timer, 
      bgColor: 'bg-card',
      borderColor: 'border-border',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
  ];

  const channelData = [
    { 
      label: 'Delivery', 
      value: formatCurrency(stats?.deliveryRevenue || 0), 
      icon: Truck, 
      orders: `${stats?.deliveryOrders || 0} pedidos`,
      participation: stats?.totalRevenue ? Math.round((stats.deliveryRevenue / stats.totalRevenue) * 100) : 0,
      color: 'bg-blue-500'
    },
    { 
      label: 'Salão (PDV)', 
      value: formatCurrency(stats?.salonRevenue || 0), 
      icon: Store, 
      orders: `${stats?.salonOrders || 0} mesas`,
      participation: stats?.totalRevenue ? Math.round((stats.salonRevenue / stats.totalRevenue) * 100) : 0,
      color: 'bg-primary'
    },
  ];

  const hourlyData = stats?.hourlyData || [];
  const paymentData = stats?.paymentMethods || [];
  const topProducts = stats?.topProducts || [];
  const peakHours = stats?.peakHours || [];

  const bottomStats = [
    { label: 'Entregas Concluídas', value: stats?.completedDeliveries?.toString() || '0' },
    { label: 'Mesas Fechadas', value: stats?.closedTables?.toString() || '0' },
    { label: 'Taxa Cancelamento', value: `${(stats?.cancelRate || 0).toFixed(1)}%` },
    { label: 'Itens Vendidos', value: stats?.itemsSold?.toString() || '0' },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  if (isLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold text-foreground">Visão Geral</h1>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="hidden sm:inline">Modo tempo real ativo</span>
              <span className="text-xs hidden lg:inline">• Última atualização: {today.toLocaleTimeString('pt-BR')}</span>
            </div>
            <button 
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium bg-card">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {dateFilterOptions.find(opt => opt.value === dateFilter)?.label}
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-card border border-border z-50">
                {dateFilterOptions.map((option) => (
                  <DropdownMenuItem 
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`cursor-pointer ${dateFilter === option.value ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    {dateFilter === option.value && (
                      <Check className="w-4 h-4 mr-2 text-primary" />
                    )}
                    <span className={dateFilter !== option.value ? 'ml-6' : ''}>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card) => (
            <div key={card.label} className={`${card.bgColor} rounded-xl p-4 border border-transparent`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Financial Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {financialCards.map((card) => (
            <div 
              key={card.label} 
              className={`${card.bgColor} rounded-xl p-4 border ${card.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${card.iconBg}`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Channel Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {channelData.map((channel) => (
            <div key={channel.label} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <channel.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{channel.label}</p>
                    <p className="text-xl font-bold text-foreground">{channel.value}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white ${channel.color}`}>
                  {channel.orders}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participação</span>
                  <span className="text-muted-foreground">{channel.participation}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${channel.color} rounded-full transition-all`}
                    style={{ width: `${channel.participation}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hourly Revenue Chart */}
          <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Faturamento por Hora</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Distribuição de vendas ao longo do dia</p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hour" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Formas de Pagamento</h3>
            </div>
            
            {paymentData.length > 0 ? (
              <>
                <div className="h-48 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {paymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center mt-4">
                  {paymentData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name} ({item.value}%)</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Sem dados de pagamento
              </div>
            )}
          </div>
        </div>

        {/* Products & Peak Hours */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Products */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Produtos Mais Vendidos</h3>
            </div>
            
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.price}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg font-medium">
                      {product.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum produto vendido neste período
              </div>
            )}
          </div>

          {/* Peak Hours */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Horários de Pico</h3>
            </div>
            
            {peakHours.length > 0 ? (
              <div className="space-y-3">
                {peakHours.map((hour, index) => (
                  <div key={hour.time} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{hour.time}</p>
                        <p className="text-sm text-muted-foreground">{hour.value}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{hour.orders}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Nenhum pedido neste período
              </div>
            )}
          </div>
        </div>

        {/* Satisfaction Chart */}
        {suggestionStats && suggestionStats.totalSuggestions > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Rating Over Time */}
            <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Smile className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Satisfação do Cliente</h3>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Period Selector */}
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {periodOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSatisfactionPeriod(option.value)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          satisfactionPeriod === option.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="font-bold text-primary">{suggestionStats.averageRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">/ 5.0</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Média de avaliações nos últimos {satisfactionPeriod === '7days' ? '7 dias' : satisfactionPeriod === '30days' ? '30 dias' : '3 meses'}
              </p>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={suggestionStats.dailyAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      domain={[0, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'average') return [value > 0 ? value.toFixed(1) : 'N/A', 'Média'];
                        return [value, 'Avaliações'];
                      }}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="average" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Distribuição</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{suggestionStats.totalSuggestions} avaliações</p>
              
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const ratingData = suggestionStats.ratingDistribution.find(r => r.rating === rating);
                  const count = ratingData?.count || 0;
                  const percentage = suggestionStats.totalSuggestions > 0 
                    ? (count / suggestionStats.totalSuggestions) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-xl w-8">{ratingEmojis[rating]}</span>
                      <div className="flex-1">
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {bottomStats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-6 border border-border text-center">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default RestaurantDashboard;

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
  Check
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
  Cell
} from 'recharts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const dateFilterOptions = [
  { value: 'today', label: 'Hoje' },
  { value: 'week', label: 'Esta Semana' },
  { value: 'month', label: 'Este Mês' },
];

const RestaurantDashboard = () => {
  const { slug } = useParams<{ slug: string }>();
  const [dateFilter, setDateFilter] = useState('today');

  // Mock data
  const statusCards = [
    { label: 'Aguardando', value: '0', icon: Clock, bgColor: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    { label: 'Na Cozinha', value: '9', icon: ChefHat, bgColor: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'Mesas Abertas', value: '0', icon: UtensilsCrossed, bgColor: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { label: 'Clientes Hoje', value: '1', icon: Users, bgColor: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  ];

  const financialCards = [
    { 
      label: 'Faturamento Total', 
      value: 'R$ 45,90', 
      icon: DollarSign, 
      change: '100.0% vs anterior',
      positive: true,
      bgColor: 'bg-primary/5',
      borderColor: 'border-primary/20',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    { 
      label: 'Pedidos', 
      value: '1', 
      icon: ShoppingBag, 
      change: '100.0%',
      positive: true,
      bgColor: 'bg-card',
      borderColor: 'border-border',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      label: 'Ticket Médio', 
      value: 'R$ 45,90', 
      icon: Receipt, 
      change: '100.0%',
      positive: true,
      bgColor: 'bg-card',
      borderColor: 'border-border',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    { 
      label: 'Tempo Médio Mesa', 
      value: '5792min', 
      subLabel: '1 mesas fechadas',
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
      value: 'R$ 0,00', 
      icon: Truck, 
      orders: '0 pedidos',
      participation: 0,
      color: 'bg-blue-500'
    },
    { 
      label: 'Salão (PDV)', 
      value: 'R$ 45,90', 
      icon: Store, 
      orders: '1 mesas',
      participation: 100,
      color: 'bg-primary'
    },
  ];

  const hourlyData = [
    { hour: '0h', value: 0 },
    { hour: '3h', value: 0 },
    { hour: '6h', value: 0 },
    { hour: '9h', value: 0 },
    { hour: '12h', value: 0 },
    { hour: '15h', value: 45.90 },
    { hour: '18h', value: 0 },
    { hour: '21h', value: 0 },
  ];

  const paymentData = [
    { name: 'Dinheiro', value: 100, color: '#F59E0B' },
  ];

  const topProducts = [
    { name: 'Angus Supreme', price: 'R$ 45,90', quantity: '1 un.' },
  ];

  const peakHours = [
    { time: '15:00', orders: '1 pedidos', value: 'R$ 45,90' },
  ];

  const bottomStats = [
    { label: 'Entregas Concluídas', value: '0' },
    { label: 'Mesas Fechadas', value: '1' },
    { label: 'Taxa Cancelamento', value: '0.0%' },
    { label: 'Itens Vendidos', value: '1' },
  ];

  const today = new Date();
  const formattedDate = today.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

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
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Modo tempo real ativo
              <span className="text-xs">• Última atualização: {today.toLocaleTimeString('pt-BR')}</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <RefreshCw className="w-4 h-4" />
              Atualizar
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
                    className={`cursor-pointer ${dateFilter === option.value ? 'bg-amber-100 text-amber-900 focus:bg-amber-100 focus:text-amber-900' : ''}`}
                  >
                    {dateFilter === option.value && (
                      <Check className="w-4 h-4 mr-2 text-amber-600" />
                    )}
                    <span className={dateFilter !== option.value ? 'ml-6' : ''}>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financialCards.map((card) => (
            <div 
              key={card.label} 
              className={`${card.bgColor} rounded-xl p-4 border ${card.borderColor}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  {card.change && (
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">{card.change}</span>
                    </div>
                  )}
                  {card.subLabel && (
                    <p className="text-xs text-muted-foreground mt-1">{card.subLabel}</p>
                  )}
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
                  <span className="text-sm text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
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
            
            <div className="space-y-3">
              {topProducts.map((product, index) => (
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
          </div>

          {/* Peak Hours */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Horários de Pico</h3>
            </div>
            
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
          </div>
        </div>

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

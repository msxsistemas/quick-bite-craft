import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Package, 
  DollarSign, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  ChevronDown,
  LayoutGrid,
  BarChart3,
  Clock,
  ChefHat,
  Truck,
  MapPin,
  Phone,
  User,
  X,
  ChevronRight,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useOrders, useUpdateOrderStatus, Order, OrderStatus, getStatusLabel, getStatusColor } from '@/hooks/useOrders';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ViewMode = 'kanban' | 'stats';

interface OrderColumn {
  id: OrderStatus;
  title: string;
  orders: Order[];
}

const OrdersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  const { data: orders = [], isLoading } = useOrders(restaurant?.id);
  const updateStatus = useUpdateOrderStatus();
  
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const dateFilterOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
  ];

  // Filter orders by date
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      switch (dateFilter) {
        case 'today':
          return orderDate >= startOfToday;
        case 'week':
          return orderDate >= startOfWeek;
        case 'month':
          return orderDate >= startOfMonth;
        default:
          return true;
      }
    });
  }, [orders, dateFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredOrders.length;
    const revenue = filteredOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0);
    const completed = filteredOrders.filter(o => o.status === 'delivered').length;
    const avgTicket = completed > 0 ? revenue / completed : 0;

    return {
      total,
      revenue,
      completed,
      avgTicket,
    };
  }, [filteredOrders]);

  // Group orders by status for kanban
  const orderColumns: OrderColumn[] = useMemo(() => {
    const columns: OrderColumn[] = [
      { id: 'pending', title: 'Pendentes', orders: [] },
      { id: 'accepted', title: 'Aceitos', orders: [] },
      { id: 'preparing', title: 'Em Preparo', orders: [] },
      { id: 'ready', title: 'Prontos', orders: [] },
      { id: 'delivering', title: 'Saiu p/ Entrega', orders: [] },
      { id: 'delivered', title: 'Finalizados', orders: [] },
    ];

    filteredOrders
      .filter(o => o.status !== 'cancelled')
      .forEach(order => {
        const column = columns.find(c => c.id === order.status);
        if (column) {
          column.orders.push(order);
        }
      });

    return columns;
  }, [filteredOrders]);

  // Chart data
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        pedidos: 0,
        receita: 0,
      };
    });

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const dayIndex = last7Days.findIndex(d => {
        const [day, month] = d.date.split('/');
        return orderDate.getDate() === parseInt(day) && orderDate.getMonth() + 1 === parseInt(month);
      });
      if (dayIndex !== -1) {
        last7Days[dayIndex].pedidos++;
        if (order.status !== 'cancelled') {
          last7Days[dayIndex].receita += order.total;
        }
      }
    });

    return last7Days;
  }, [orders]);

  const statusChartData = useMemo(() => {
    return [
      { name: 'Pendentes', value: orderColumns.find(c => c.id === 'pending')?.orders.length || 0 },
      { name: 'Em Preparo', value: orderColumns.find(c => c.id === 'preparing')?.orders.length || 0 },
      { name: 'Saiu p/ Entrega', value: orderColumns.find(c => c.id === 'delivering')?.orders.length || 0 },
      { name: 'Finalizados', value: orderColumns.find(c => c.id === 'delivered')?.orders.length || 0 },
    ];
  }, [orderColumns]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(`Status atualizado para ${getStatusLabel(newStatus)}`);
      setSelectedOrder(null);
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const flow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'delivering',
      delivering: 'delivered',
      delivered: null,
      cancelled: null,
    };
    return flow[currentStatus];
  };

  const getBadgeColor = (id: OrderStatus) => {
    const colors = getStatusColor(id);
    return colors.bg.replace('bg-', 'bg-').replace('-100', '-500');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statsCards = [
    { icon: Package, label: 'Total Pedidos', value: stats.total.toString(), bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
    { icon: DollarSign, label: 'Receita', value: formatCurrency(stats.revenue), bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: CheckCircle, label: 'Finalizados', value: stats.completed.toString(), bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: TrendingUp, label: 'Ticket Médio', value: formatCurrency(stats.avgTicket), bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

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
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium bg-card">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {dateFilterOptions.find(opt => opt.value === dateFilter)?.label}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {dateFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setDateFilter(option.value)}
                  className={dateFilter === option.value ? 'bg-amber-100 text-amber-900' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-amber-500 text-white'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Gerenciar
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'stats'
                  ? 'bg-amber-500 text-white'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Estatísticas
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.bgColor} rounded-full flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {viewMode === 'kanban' ? (
          /* Kanban Board */
          <div className="grid grid-cols-6 gap-3 overflow-x-auto">
            {orderColumns.map((column) => {
              const colors = getStatusColor(column.id);
              return (
                <div
                  key={column.id}
                  className={`${colors.bg} rounded-xl p-3 min-h-[400px]`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold text-sm ${colors.text}`}>{column.title}</h3>
                    <span className={`w-6 h-6 ${getBadgeColor(column.id)} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                      {column.orders.length}
                    </span>
                  </div>
                  
                  {column.orders.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Nenhum pedido
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {column.orders.map((order) => (
                        <div 
                          key={order.id} 
                          className="bg-card p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm">#{order.order_number}</span>
                            <span className="text-xs text-muted-foreground">{formatTime(order.created_at)}</span>
                          </div>
                          <p className="text-sm font-medium truncate">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                          </p>
                          <p className="text-sm font-bold text-primary mt-1">{formatCurrency(order.total)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Statistics View */
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-2 gap-6">
              {/* Orders Chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Pedidos nos últimos 7 dias</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pedidos" 
                        stroke="#f59e0b" 
                        fill="#fef3c7" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue Chart */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-4">Receita nos últimos 7 dias</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        stroke="#9ca3af"
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'receita']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="receita" 
                        stroke="#22c55e" 
                        fill="#dcfce7" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Status Bar Chart */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">Pedidos por Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Pedido #{selectedOrder.order_number}</span>
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedOrder.status).bg} ${getStatusColor(selectedOrder.status).text}`}>
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Customer Info */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedOrder.customer_phone}</span>
                  </div>
                  {selectedOrder.customer_address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-sm">{selectedOrder.customer_address}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-semibold mb-2">Itens</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => {
                      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
                      const itemTotal = (item.productPrice + extrasTotal) * item.quantity;
                      
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <div>
                            <span className="font-medium">{item.quantity}x {item.productName}</span>
                            {item.extras && item.extras.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                + {item.extras.map(e => e.optionName).join(', ')}
                              </p>
                            )}
                            {item.notes && (
                              <p className="text-xs text-muted-foreground italic">Obs: {item.notes}</p>
                            )}
                          </div>
                          <span>{formatCurrency(itemTotal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-{formatCurrency(selectedOrder.discount)}</span>
                    </div>
                  )}
                  {selectedOrder.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de entrega</span>
                      <span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Pagamento: </span>
                    <span className="font-medium capitalize">{selectedOrder.payment_method}</span>
                    {selectedOrder.payment_change && (
                      <span className="text-muted-foreground"> (Troco para {formatCurrency(selectedOrder.payment_change)})</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {getNextStatus(selectedOrder.status) && (
                      <Button 
                        className="flex-1"
                        onClick={() => handleUpdateStatus(selectedOrder.id, getNextStatus(selectedOrder.status)!)}
                        disabled={updateStatus.isPending}
                      >
                        {updateStatus.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <ChevronRight className="w-4 h-4 mr-2" />
                        )}
                        Avançar para {getStatusLabel(getNextStatus(selectedOrder.status)!)}
                      </Button>
                    )}
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                      disabled={updateStatus.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default OrdersPage;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Loader2, ShoppingCart, DollarSign, Clock, CheckCircle, Users } from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters } from '@/hooks/useWaiters';
import { useTables } from '@/hooks/useTables';
import { useOrders, OrderItem } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Waiter {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug || '');
  const { waiters, isLoading: waitersLoading } = useWaiters(restaurant?.id);
  const { tables } = useTables(restaurant?.id);
  const { data: orders } = useOrders(restaurant?.id);
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const activeWaiters = waiters?.filter(w => w.active) || [];

  // Get waiter's tables and orders
  const waiterTables = tables.filter(t => t.current_waiter_id === selectedWaiter?.id);
  const waiterOrders = orders?.filter(o => o.waiter_id === selectedWaiter?.id) || [];
  
  // Calculate today's stats
  const today = new Date().toDateString();
  const todayOrders = waiterOrders.filter(o => new Date(o.created_at).toDateString() === today);
  const todayTips = todayOrders.reduce((sum, o) => sum + (o.tip_amount || 0), 0);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const selectedOrder = orders?.find(o => o.id === selectedOrderId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'accepted': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-orange-100 text-orange-700';
      case 'ready': return 'bg-purple-100 text-purple-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'accepted': return 'Aceito';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto';
      case 'delivered': return 'Entregue';
      default: return status;
    }
  };

  if (restaurantLoading || waitersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Waiter selection screen
  if (!selectedWaiter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            {/* Logo/Image */}
            <div className="flex justify-center mb-6">
              {restaurant?.logo ? (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-amber-800 to-amber-950 rounded-full flex items-center justify-center overflow-hidden">
                  <span className="text-3xl">🍔</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">Olá, Garçom!</h1>
              <p className="text-muted-foreground">Selecione seu nome para acessar o sistema</p>
              {restaurant?.name && (
                <p className="text-sm text-primary font-medium mt-2">{restaurant.name}</p>
              )}
            </div>

            {/* Waiter List */}
            {activeWaiters.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum garçom cadastrado</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Peça ao administrador para cadastrar garçons
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWaiters.map((waiter) => (
                  <button
                    key={waiter.id}
                    onClick={() => setSelectedWaiter(waiter)}
                    className="w-full flex items-center gap-4 p-4 border border-border rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{waiter.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiter dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{selectedWaiter.name}</p>
              <p className="text-xs text-muted-foreground">{restaurant?.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setSelectedWaiter(null)}>
            Trocar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border rounded-xl p-4 text-center">
            <ShoppingCart className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{todayOrders.length}</p>
            <p className="text-xs text-muted-foreground">Pedidos Hoje</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(todayTips)}</p>
            <p className="text-xs text-muted-foreground">Gorjetas Hoje</p>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
            <p className="text-xs text-muted-foreground">Vendas Hoje</p>
          </div>
        </div>

        {/* My Tables */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Minhas Mesas ({waiterTables.length})
          </h2>
          {waiterTables.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Nenhuma mesa atribuída</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {waiterTables.map(table => (
                <div key={table.id} className="bg-card border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">{table.name}</p>
                    <Badge className={
                      table.status === 'occupied' ? 'bg-red-100 text-red-700' :
                      table.status === 'requesting' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {table.status === 'occupied' ? 'Ocupada' :
                       table.status === 'requesting' ? 'Conta' : 'Livre'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Capacidade: {table.capacity} pessoas
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pedidos Recentes
          </h2>
          {todayOrders.length === 0 ? (
            <div className="bg-muted/30 rounded-xl p-6 text-center">
              <p className="text-muted-foreground">Nenhum pedido hoje</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayOrders.slice(0, 10).map(order => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className="w-full bg-card border rounded-xl p-4 text-left hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">Pedido #{order.order_number}</p>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{order.customer_name}</span>
                    <span className="font-medium">{formatCurrency(order.total)}</span>
                  </div>
                  {order.tip_amount > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Gorjeta: {formatCurrency(order.tip_amount)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrderId} onOpenChange={() => setSelectedOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium">{selectedOrder.customer_name}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusLabel(selectedOrder.status)}
                </Badge>
              </div>

              <div className="border-t pt-4">
                <p className="font-medium mb-2">Itens:</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatCurrency(item.productPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.tip_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Gorjeta:</span>
                    <span>{formatCurrency(selectedOrder.tip_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WaiterAccessPage;

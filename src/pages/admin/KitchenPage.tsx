import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChefHat, Clock, Volume2, VolumeX, RefreshCw, ArrowLeft, CheckCircle, Package, Loader2, Printer } from 'lucide-react';
import { useUpdateOrderStatus, Order, OrderStatus, getStatusLabel } from '@/hooks/useOrders';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/app-toast';
import { OrderPrintView } from '@/components/kitchen/OrderPrintView';

const KITCHEN_SOUND_KEY = 'kitchen_sound_enabled';

const KitchenPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  
  // Persist sound preference in localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(KITCHEN_SOUND_KEY);
    return stored !== null ? stored === 'true' : true;
  });
  
  // Use the kitchen-specific hook with sound control
  const { data: orders = [], isLoading, refetch } = useKitchenOrders(restaurant?.id, soundEnabled);
  const updateStatus = useUpdateOrderStatus();

  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Save sound preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(KITCHEN_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Filter only kitchen-relevant orders (pending, accepted, preparing, ready)
  const kitchenOrders = useMemo(() => {
    return orders.filter(o => 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    );
  }, [orders]);

  const pendingOrders = kitchenOrders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const preparingOrders = kitchenOrders.filter(o => o.status === 'preparing');
  const readyOrders = kitchenOrders.filter(o => o.status === 'ready');

  const statusCards = [
    { icon: Clock, label: 'Pendentes', count: pendingOrders.length, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', borderColor: 'border-yellow-400' },
    { icon: ChefHat, label: 'Preparando', count: preparingOrders.length, bgColor: 'bg-blue-100', textColor: 'text-blue-600', borderColor: 'border-blue-400' },
    { icon: CheckCircle, label: 'Prontos', count: readyOrders.length, bgColor: 'bg-green-100', textColor: 'text-green-600', borderColor: 'border-green-400' },
  ];

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(`Pedido atualizado para ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const getTimeSinceOrder = (dateString: string) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getUrgencyColor = (dateString: string) => {
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - orderDate.getTime()) / 60000);
    
    if (diffMinutes > 30) return 'border-red-500 bg-red-50';
    if (diffMinutes > 15) return 'border-orange-500 bg-orange-50';
    return 'border-border';
  };

  const OrderCard = ({ order, showActions }: { order: Order; showActions: boolean }) => {
    const isExpanded = expandedOrder === order.id;

    return (
      <div 
        className={`bg-card rounded-xl border-2 ${getUrgencyColor(order.created_at)} overflow-hidden transition-all`}
      >
        {/* Header */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold">#{order.order_number}</span>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-muted">
              {getTimeSinceOrder(order.created_at)}
            </span>
          </div>
          <p className="font-medium">{order.customer_name}</p>
          <p className="text-sm text-muted-foreground">
            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
          </p>
        </div>

        {/* Items (Always visible for kitchen) */}
        <div className="px-4 pb-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg leading-none">{item.quantity}x</span>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-muted-foreground">
                        + {item.extras.map(e => e.optionName).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-orange-600 font-medium">⚠️ {item.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-2 p-2 bg-orange-100 rounded-lg">
              <p className="text-sm text-orange-700 font-medium">📝 {order.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="border-t p-3 flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                handlePrint(order);
              }}
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
            </Button>
            {order.status === 'pending' && (
              <Button 
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                onClick={() => handleUpdateStatus(order.id, 'accepted')}
                disabled={updateStatus.isPending}
              >
                Aceitar
              </Button>
            )}
            {order.status === 'accepted' && (
              <Button 
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={() => handleUpdateStatus(order.id, 'preparing')}
                disabled={updateStatus.isPending}
              >
                Iniciar Preparo
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button 
                className="flex-1 bg-green-500 hover:bg-green-600"
                onClick={() => handleUpdateStatus(order.id, 'ready')}
                disabled={updateStatus.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Marcar Pronto
              </Button>
            )}
            {order.status === 'ready' && (
              <Button 
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                onClick={() => handleUpdateStatus(order.id, 'delivering')}
                disabled={updateStatus.isPending}
              >
                Saiu p/ Entrega
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Cozinha</h1>
              <p className="text-sm text-muted-foreground">{restaurant?.name || 'Carregando...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className={`p-2 rounded-lg border transition-colors ${soundEnabled ? 'bg-green-100 border-green-300' : 'border-border hover:bg-muted'}`}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Som ativado' : 'Som desativado'}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-green-600" />
              ) : (
                <VolumeX className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            <button 
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              onClick={() => refetch()}
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link 
              to={`/r/${slug}/admin/dashboard`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-6 text-center border-2 ${card.borderColor}`}
            >
              <card.icon className={`w-6 h-6 mx-auto mb-2 ${card.textColor}`} />
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.count}</p>
              <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Kitchen Board */}
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum pedido pendente</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {/* Pending Column */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-600">
                <Clock className="w-5 h-5" />
                Pendentes ({pendingOrders.length})
              </h2>
              <div className="space-y-4">
                {pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} showActions={true} />
                ))}
              </div>
            </div>

            {/* Preparing Column */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600">
                <ChefHat className="w-5 h-5" />
                Preparando ({preparingOrders.length})
              </h2>
              <div className="space-y-4">
                {preparingOrders.map(order => (
                  <OrderCard key={order.id} order={order} showActions={true} />
                ))}
              </div>
            </div>

            {/* Ready Column */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Prontos ({readyOrders.length})
              </h2>
              <div className="space-y-4">
                {readyOrders.map(order => (
                  <OrderCard key={order.id} order={order} showActions={true} />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Hidden print view */}
      {printOrder && (
        <div className="hidden print:block">
          <OrderPrintView 
            ref={printRef} 
            order={printOrder} 
            restaurantName={restaurant?.name}
          />
        </div>
      )}
    </div>
  );
};

export default KitchenPage;

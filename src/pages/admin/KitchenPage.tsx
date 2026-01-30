import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChefHat, Clock, Volume2, VolumeX, RefreshCw, ArrowLeft, CheckCircle, Loader2, Printer, Maximize, Minimize, Package, AlertTriangle } from 'lucide-react';
import { useUpdateOrderStatus, Order, OrderStatus, getStatusLabel } from '@/hooks/useOrders';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/app-toast';
import { OrderPrintView } from '@/components/kitchen/OrderPrintView';
import { KitchenOrderCard } from '@/components/kitchen/KitchenOrderCard';
import { ProductionSummary } from '@/components/kitchen/ProductionSummary';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const KITCHEN_SOUND_KEY = 'kitchen_sound_enabled';
const KITCHEN_AUTO_PRINT_KEY = 'kitchen_auto_print_enabled';
const KITCHEN_URGENT_SOUND_KEY = 'kitchen_urgent_sound_enabled';

const KitchenPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug);
  const { settings } = useRestaurantSettings(restaurant?.id);
  
  // Persist preferences in localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(KITCHEN_SOUND_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  const [autoPrintEnabled, setAutoPrintEnabled] = useState(() => {
    const stored = localStorage.getItem(KITCHEN_AUTO_PRINT_KEY);
    return stored !== null ? stored === 'true' : false;
  });

  const [urgentSoundEnabled, setUrgentSoundEnabled] = useState(() => {
    const stored = localStorage.getItem(KITCHEN_URGENT_SOUND_KEY);
    return stored !== null ? stored === 'true' : true;
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  
  // Use the kitchen-specific hook with sound control
  const { data: orders = [], isLoading, refetch } = useKitchenOrders(restaurant?.id, soundEnabled);
  const updateStatus = useUpdateOrderStatus();

  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const urgentCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Tempo máximo de preparo configurado
  const maxDeliveryTime = settings?.max_delivery_time || 45;
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(KITCHEN_SOUND_KEY, String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem(KITCHEN_AUTO_PRINT_KEY, String(autoPrintEnabled));
  }, [autoPrintEnabled]);

  useEffect(() => {
    localStorage.setItem(KITCHEN_URGENT_SOUND_KEY, String(urgentSoundEnabled));
  }, [urgentSoundEnabled]);

  // Auto-print new orders
  useEffect(() => {
    if (!autoPrintEnabled || !orders.length) return;

    const currentIds = new Set(orders.map(o => o.id));
    
    orders.forEach(order => {
      if (!previousOrderIdsRef.current.has(order.id) && 
          (order.status === 'pending' || order.status === 'accepted')) {
        // New order - print it
        handlePrint(order);
      }
    });

    previousOrderIdsRef.current = currentIds;
  }, [orders, autoPrintEnabled]);

  // Play urgent sound for delayed orders
  const playUrgentSound = useCallback(() => {
    if (!urgentSoundEnabled || !soundEnabled) return;
    
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 1;
      audio.playbackRate = 1.3; // Faster playback for urgency
      audio.play().catch(console.log);
    } catch (error) {
      console.log('Error playing urgent sound:', error);
    }
  }, [urgentSoundEnabled, soundEnabled]);

  // Check for urgent orders every minute
  useEffect(() => {
    const checkUrgentOrders = () => {
      const urgentOrders = orders.filter(o => {
        if (!['pending', 'accepted', 'preparing'].includes(o.status)) return false;
        const diffMinutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
        return diffMinutes > maxDeliveryTime;
      });

      if (urgentOrders.length > 0) {
        playUrgentSound();
      }
    };

    urgentCheckIntervalRef.current = setInterval(checkUrgentOrders, 60000);
    
    return () => {
      if (urgentCheckIntervalRef.current) {
        clearInterval(urgentCheckIntervalRef.current);
      }
    };
  }, [orders, maxDeliveryTime, playUrgentSound]);

  const handlePrint = (order: Order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Filter only kitchen-relevant orders (pending, accepted, preparing, ready)
  const kitchenOrders = useMemo(() => {
    return orders.filter(o => 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    );
  }, [orders]);

  // Sort by urgency (oldest first)
  const sortByUrgency = (orderList: Order[]) => {
    return [...orderList].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  };

  const pendingOrders = sortByUrgency(kitchenOrders.filter(o => o.status === 'pending' || o.status === 'accepted'));
  const preparingOrders = sortByUrgency(kitchenOrders.filter(o => o.status === 'preparing'));
  const readyOrders = sortByUrgency(kitchenOrders.filter(o => o.status === 'ready'));

  // Count urgent orders
  const urgentCount = useMemo(() => {
    return kitchenOrders.filter(o => {
      const diffMinutes = Math.floor((Date.now() - new Date(o.created_at).getTime()) / 60000);
      return diffMinutes > maxDeliveryTime;
    }).length;
  }, [kitchenOrders, maxDeliveryTime]);

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
      <header className="bg-card border-b border-border px-4 lg:px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Cozinha</h1>
              <p className="text-sm text-muted-foreground">{restaurant?.name || 'Carregando...'}</p>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{urgentCount} atrasado{urgentCount > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Production Summary Toggle */}
            <Button
              variant={showSummary ? "default" : "outline"}
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className="hidden lg:flex"
            >
              <Package className="w-4 h-4 mr-2" />
              Resumo
            </Button>

            {/* Auto Print Toggle */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border">
              <Printer className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="auto-print" className="text-sm cursor-pointer">Auto</Label>
              <Switch
                id="auto-print"
                checked={autoPrintEnabled}
                onCheckedChange={setAutoPrintEnabled}
              />
            </div>

            {/* Sound Toggle */}
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

            {/* Fullscreen Toggle */}
            <button 
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Maximize className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* Refresh */}
            <button 
              className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
              onClick={() => refetch()}
              title="Atualizar"
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Back to Admin */}
            <Link 
              to={`/r/${slug}/admin/dashboard`}
              className="hidden lg:flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-4 lg:p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-6 lg:mb-8">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-3 lg:p-6 text-center border-2 ${card.borderColor}`}
            >
              <card.icon className={`w-5 lg:w-6 h-5 lg:h-6 mx-auto mb-1 lg:mb-2 ${card.textColor}`} />
              <p className={`text-2xl lg:text-3xl font-bold ${card.textColor}`}>{card.count}</p>
              <p className={`text-xs lg:text-sm font-medium ${card.textColor}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Production Summary (when visible) */}
        {showSummary && (pendingOrders.length > 0 || preparingOrders.length > 0) && (
          <div className="mb-6">
            <ProductionSummary 
              orders={[...pendingOrders, ...preparingOrders]} 
              onClose={() => setShowSummary(false)}
            />
          </div>
        )}

        {/* Kitchen Board */}
        {kitchenOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum pedido pendente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Pending Column */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-600">
                <Clock className="w-5 h-5" />
                Pendentes ({pendingOrders.length})
              </h2>
              <div className="space-y-4">
                {pendingOrders.map(order => (
                  <KitchenOrderCard 
                    key={order.id} 
                    order={order} 
                    showActions={true}
                    maxDeliveryTime={maxDeliveryTime}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={handlePrint}
                    isUpdating={updateStatus.isPending}
                  />
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
                  <KitchenOrderCard 
                    key={order.id} 
                    order={order} 
                    showActions={true}
                    maxDeliveryTime={maxDeliveryTime}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={handlePrint}
                    isUpdating={updateStatus.isPending}
                  />
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
                  <KitchenOrderCard 
                    key={order.id} 
                    order={order} 
                    showActions={true}
                    maxDeliveryTime={maxDeliveryTime}
                    onUpdateStatus={handleUpdateStatus}
                    onPrint={handlePrint}
                    isUpdating={updateStatus.isPending}
                  />
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

import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ChefHat, Truck, MapPin, Clock, Phone, CreditCard } from 'lucide-react';
import { useOrderById, getStatusLabel, getStatusColor, OrderStatus } from '@/hooks/useOrders';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const DELIVERY_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pedido realizado' },
  { status: 'accepted', label: 'Pedido aceito' },
  { status: 'preparing', label: 'Pedido em produção' },
  { status: 'delivering', label: 'Saiu para entrega' },
  { status: 'delivered', label: 'Entregue' },
];

const PICKUP_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Pedido realizado' },
  { status: 'accepted', label: 'Pedido aceito' },
  { status: 'preparing', label: 'Pedido em produção' },
  { status: 'ready', label: 'Pronto para retirada' },
  { status: 'delivered', label: 'Entregue' },
];

const getStepIndex = (status: OrderStatus, isDelivery: boolean): number => {
  if (status === 'cancelled') return -1;
  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const index = steps.findIndex(step => step.status === status);
  return index;
};

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-gray-100 px-4 py-2.5">
    <h3 className="font-semibold text-gray-900 text-sm">{children}</h3>
  </div>
);

const OrderTrackingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  
  const { restaurant, isLoading: restaurantLoading } = usePublicMenu(slug);
  const { data: order, isLoading: orderLoading } = useOrderById(orderId || undefined);

  const isLoading = restaurantLoading || orderLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-4">O pedido que você está procurando não existe.</p>
        <Button onClick={() => navigate(`/r/${slug}`)}>
          Voltar ao cardápio
        </Button>
      </div>
    );
  }

  const isDelivery = !!order.customer_address;
  const currentStepIndex = getStepIndex(order.status, isDelivery);
  const orderSteps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const statusColors = getStatusColor(order.status);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'Pix',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
    };
    return labels[method] || method;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="p-1"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-semibold text-gray-900">Detalhes do pedido</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Order Info */}
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <h1 className="font-bold text-gray-900">Pedido #{order.order_number}</h1>
          <p className="text-sm text-gray-500">
            Em {formatDate(order.created_at)} às {formatTime(order.created_at)}
          </p>
        </div>

        {/* Status Section */}
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Status</span>
            <Badge className={`${statusColors.bg} ${statusColors.text} border-0 font-medium`}>
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          
          {/* Timeline */}
          {order.status !== 'cancelled' && (
            <div className="px-4 pb-4">
              <div className="relative">
                {/* Background line (same blue as dots) */}
                <div 
                  className="absolute left-[5px] top-[6px] bottom-[6px] w-0.5 bg-blue-500" 
                />
                {/* Progress line (blue) - height based on completed steps */}
                {currentStepIndex >= 0 && (
                  <div 
                    className="absolute left-[5px] top-[6px] w-0.5 bg-blue-500 z-[1]" 
                    style={{ 
                      height: currentStepIndex === orderSteps.length - 1 
                        ? 'calc(100% - 12px)' 
                        : `calc(${(currentStepIndex / (orderSteps.length - 1)) * 100}% - 6px)`
                    }}
                  />
                )}
                
                <div className="flex flex-col gap-3">
                  {orderSteps.map((step, index) => {
                    const isCurrent = index === currentStepIndex;
                    const isPast = index < currentStepIndex;
                    const isCompleted = isPast || isCurrent;
                    
                    // Get the timestamp for this step
                    const getStepTime = () => {
                      if (!isCompleted) return null;
                      const timestamps: Record<string, string | null> = {
                        pending: order.created_at,
                        accepted: order.accepted_at,
                        preparing: order.preparing_at,
                        ready: order.ready_at,
                        delivering: order.delivering_at,
                        delivered: order.delivered_at,
                      };
                      return timestamps[step.status];
                    };
                    
                    const stepTime = getStepTime();
                    
                    return (
                      <div key={step.status} className="flex items-center gap-3 relative">
                        <div 
                          className={`w-3 h-3 rounded-full z-10 shrink-0 ${
                            isCompleted 
                              ? 'bg-blue-500' 
                              : 'bg-white border-2 border-blue-500'
                          }`}
                        />
                        <span className={`text-sm ${
                          isCompleted ? 'text-gray-700' : 'text-gray-400'
                        }`}>
                          {stepTime && (
                            <span className="text-blue-500 font-medium">
                              {formatTime(stepTime)} -{' '}
                            </span>
                          )}
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {order.status === 'cancelled' && (
            <div className="px-4 pb-4">
              <p className="text-sm text-red-600">Este pedido foi cancelado</p>
            </div>
          )}
        </div>

        {/* Delivery Method */}
        {order.customer_address && (
          <>
            <SectionHeader>Forma de entrega</SectionHeader>
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">Entrega</p>
                  <p className="text-sm text-gray-600">{order.customer_address}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {!order.customer_address && (
          <>
            <SectionHeader>Buscar o pedido</SectionHeader>
            <div className="bg-white px-4 py-3 border-b border-gray-100">
              <p className="text-sm text-gray-600">Retirada no local</p>
            </div>
          </>
        )}

        {/* Payment Method */}
        <SectionHeader>Forma de pagamento</SectionHeader>
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <p className="font-medium text-gray-900 text-sm">{getPaymentMethodLabel(order.payment_method)}</p>
          {order.payment_change && order.payment_change > 0 && (
            <p className="text-sm text-gray-500">Troco para: {formatCurrency(order.payment_change)}</p>
          )}
        </div>

        {/* Order Items */}
        <SectionHeader>Itens do pedido</SectionHeader>
        <div className="bg-white border-b border-gray-100">
          <div className="px-4 py-3 space-y-3">
            {order.items.map((item, index) => {
              const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
              const itemTotal = (item.productPrice + extrasTotal) * item.quantity;

              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs text-gray-500">{item.quantity}x</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{item.productName}</p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-xs text-gray-500">
                        + {item.extras.map(e => e.optionName).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-gray-400 italic">
                        Obs: {item.notes}
                      </p>
                    )}
                    <p className="text-sm text-primary font-medium">{formatCurrency(itemTotal)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-700">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Taxa de entrega</span>
              <span className={order.delivery_fee === 0 ? "text-green-600" : "text-gray-700"}>
                {order.delivery_fee === 0 ? 'Grátis' : formatCurrency(order.delivery_fee)}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-2">
              <span className="text-gray-900">Total</span>
              <span className="text-gray-900">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white mt-4 px-4 py-6 text-center">
          <p className="text-sm text-gray-500 mb-3">Dúvidas sobre seu pedido?</p>
          <Button 
            variant="outline" 
            className="border-gray-300"
            onClick={() => {
              const whatsappNumber = restaurant?.whatsapp?.replace(/\D/g, '') || restaurant?.phone?.replace(/\D/g, '');
              if (whatsappNumber) {
                window.open(`https://wa.me/55${whatsappNumber}?text=Olá! Gostaria de informações sobre meu pedido #${order.order_number}`, '_blank');
              }
            }}
          >
            <Phone className="w-4 h-4 mr-2" />
            Falar com o restaurante
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;

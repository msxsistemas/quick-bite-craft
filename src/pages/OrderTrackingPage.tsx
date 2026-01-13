import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, CheckCircle, ChefHat, Truck, MapPin, Clock, Phone, User, CreditCard, FileText } from 'lucide-react';
import { useOrderById, getStatusLabel, getStatusColor, OrderStatus } from '@/hooks/useOrders';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ORDER_STEPS: { status: OrderStatus; icon: React.ElementType; label: string }[] = [
  { status: 'pending', icon: Clock, label: 'Pendente' },
  { status: 'accepted', icon: CheckCircle, label: 'Aceito' },
  { status: 'preparing', icon: ChefHat, label: 'Em Preparo' },
  { status: 'ready', icon: Package, label: 'Pronto' },
  { status: 'delivering', icon: Truck, label: 'Em Entrega' },
  { status: 'delivered', icon: MapPin, label: 'Entregue' },
];

const getStepIndex = (status: OrderStatus): number => {
  if (status === 'cancelled') return -1;
  const index = ORDER_STEPS.findIndex(step => step.status === status);
  return index;
};

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Pedido não encontrado</h1>
        <p className="text-muted-foreground mb-4">O pedido que você está procurando não existe.</p>
        <Button onClick={() => navigate(`/r/${slug}`)}>
          Voltar ao cardápio
        </Button>
      </div>
    );
  }

  const currentStepIndex = getStepIndex(order.status);
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

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Pedido #{order.order_number}</h1>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.created_at)} às {formatTime(order.created_at)}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status Badge */}
        <div className={`${statusColors.bg} ${statusColors.border} border-2 rounded-xl p-4 text-center`}>
          <p className={`text-lg font-bold ${statusColors.text}`}>
            {getStatusLabel(order.status)}
          </p>
          {order.status === 'cancelled' && (
            <p className="text-sm text-red-600 mt-1">Este pedido foi cancelado</p>
          )}
        </div>

        {/* Order Progress */}
        {order.status !== 'cancelled' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-6">Acompanhe seu pedido</h3>
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              <div 
                className="absolute left-5 top-0 w-0.5 bg-primary transition-all duration-500"
                style={{ 
                  height: currentStepIndex >= 0 
                    ? `${Math.min((currentStepIndex / (ORDER_STEPS.length - 1)) * 100, 100)}%` 
                    : '0%' 
                }}
              />

              {/* Steps */}
              <div className="space-y-6">
                {ORDER_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex items-center gap-4 relative">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all ${
                          isCompleted 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-sm text-primary animate-pulse">Em andamento...</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Itens do pedido
          </h3>
          <div className="space-y-3">
            {order.items.map((item, index) => {
              const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
              const itemTotal = (item.productPrice + extrasTotal) * item.quantity;

              return (
                <div key={index} className="flex justify-between">
                  <div className="flex-1">
                    <p className="font-medium">
                      {item.quantity}x {item.productName}
                    </p>
                    {item.extras && item.extras.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        + {item.extras.map(e => e.optionName).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        Obs: {item.notes}
                      </p>
                    )}
                  </div>
                  <p className="font-medium">{formatCurrency(itemTotal)}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border mt-4 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de entrega</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Payment Info */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{order.customer_name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{order.customer_phone}</p>
            </div>
          </div>

          {order.customer_address && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p className="font-medium">{order.customer_address}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagamento</p>
              <p className="font-medium capitalize">{order.payment_method}</p>
              {order.payment_change && (
                <p className="text-sm text-muted-foreground">
                  Troco para {formatCurrency(order.payment_change)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Contact */}
        <div className="bg-muted/50 rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">Dúvidas sobre seu pedido?</p>
          <Button 
            variant="outline" 
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

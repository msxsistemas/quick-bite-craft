import { Order, OrderStatus } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Truck, ShoppingBag, UtensilsCrossed } from 'lucide-react';

interface KitchenOrderCardProps {
  order: Order;
  showActions: boolean;
  maxDeliveryTime: number;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  onPrint: (order: Order) => void;
  isUpdating: boolean;
}

export const KitchenOrderCard = ({
  order,
  showActions,
  maxDeliveryTime,
  onUpdateStatus,
  onPrint,
  isUpdating,
}: KitchenOrderCardProps) => {
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
    
    // Usa o tempo máximo de entrega configurado
    const urgentTime = maxDeliveryTime;
    const warningTime = Math.floor(maxDeliveryTime * 0.6);
    
    if (diffMinutes > urgentTime) return 'border-red-500 bg-red-50 animate-pulse';
    if (diffMinutes > warningTime) return 'border-orange-500 bg-orange-50';
    return 'border-border';
  };

  const getOrderTypeInfo = () => {
    // Verifica se é mesa, comanda, retirada ou delivery
    if (order.table_id) {
      return { icon: UtensilsCrossed, label: 'Mesa', color: 'text-purple-600 bg-purple-100' };
    }
    if (order.comanda_id) {
      return { icon: UtensilsCrossed, label: 'Comanda', color: 'text-purple-600 bg-purple-100' };
    }
    if (!order.customer_address || order.customer_address === 'Retirada no local') {
      return { icon: ShoppingBag, label: 'Retirada', color: 'text-amber-600 bg-amber-100' };
    }
    return { icon: Truck, label: 'Delivery', color: 'text-blue-600 bg-blue-100' };
  };

  const orderType = getOrderTypeInfo();
  const OrderTypeIcon = orderType.icon;

  return (
    <div 
      className={`bg-card rounded-xl border-2 ${getUrgencyColor(order.created_at)} overflow-hidden transition-all`}
    >
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">#{order.order_number}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${orderType.color}`}>
              <OrderTypeIcon className="w-3 h-3" />
              {orderType.label}
            </span>
          </div>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-muted">
            {getTimeSinceOrder(order.created_at)}
          </span>
        </div>
        <p className="font-medium">{order.customer_name}</p>
        <p className="text-sm text-muted-foreground">
          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • {formatCurrency(order.total)}
        </p>
      </div>

      {/* Items */}
      <div className="px-4 pb-4">
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="text-sm border-b border-border/50 last:border-0 pb-2 last:pb-0">
              <div className="flex items-start gap-2">
                <span className="font-bold text-lg leading-none min-w-[28px]">{item.quantity}x</span>
                <div className="flex-1">
                  <p className="font-semibold text-base">{item.productName}</p>
                  {/* Adicionais e escolhas de grupos */}
                  {item.extras && item.extras.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {item.extras.map((extra, idx) => (
                        <p key={idx} className="text-sm text-blue-600">
                          + {extra.optionName}
                          {extra.groupTitle && <span className="text-muted-foreground text-xs"> ({extra.groupTitle})</span>}
                        </p>
                      ))}
                    </div>
                  )}
                  {/* Observações do item */}
                  {item.notes && (
                    <p className="text-orange-600 font-medium mt-1 bg-orange-50 px-2 py-1 rounded text-sm">⚠️ {item.notes}</p>
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
              onPrint(order);
            }}
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </Button>
          {/* Na cozinha: pending e accepted vão direto para preparing */}
          {(order.status === 'pending' || order.status === 'accepted') && (
            <Button 
              className="flex-1 bg-orange-500 hover:bg-orange-600"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
            >
              Iniciar Preparo
            </Button>
          )}
          {order.status === 'preparing' && (
            <Button 
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => onUpdateStatus(order.id, 'ready')}
              disabled={isUpdating}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Pronto
            </Button>
          )}
          {order.status === 'ready' && (
            <Button 
              className="flex-1 bg-cyan-500 hover:bg-cyan-600"
              onClick={() => onUpdateStatus(order.id, 'delivering')}
              disabled={isUpdating}
            >
              Saiu p/ Entrega
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

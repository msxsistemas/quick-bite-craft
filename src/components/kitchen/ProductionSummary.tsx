import { useMemo } from 'react';
import { Order } from '@/hooks/useOrders';
import { Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductionSummaryProps {
  orders: Order[];
  onClose: () => void;
}

interface ProductionItem {
  productName: string;
  quantity: number;
  orders: number[];
}

export const ProductionSummary = ({ orders, onClose }: ProductionSummaryProps) => {
  const productionItems = useMemo(() => {
    const itemMap = new Map<string, ProductionItem>();

    orders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productName;
        const existing = itemMap.get(key);
        
        if (existing) {
          existing.quantity += item.quantity;
          if (!existing.orders.includes(order.order_number)) {
            existing.orders.push(order.order_number);
          }
        } else {
          itemMap.set(key, {
            productName: item.productName,
            quantity: item.quantity,
            orders: [order.order_number],
          });
        }
      });
    });

    return Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const totalItems = productionItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-card border rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">Resumo de Produção</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground mb-3">
        {totalItems} itens em {orders.length} pedidos
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {productionItems.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center justify-between p-3 rounded-lg ${
              item.orders.length > 1 ? 'bg-blue-50 border border-blue-200' : 'bg-muted/50'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{item.quantity}x</span>
                <span className="font-medium">{item.productName}</span>
              </div>
              {item.orders.length > 1 && (
                <p className="text-xs text-blue-600 mt-1">
                  🔄 Em lote: #{item.orders.join(', #')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {productionItems.some(item => item.orders.length > 1) && (
        <div className="mt-4 p-2 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 Itens destacados em azul aparecem em múltiplos pedidos - produza em lote!
          </p>
        </div>
      )}
    </div>
  );
};

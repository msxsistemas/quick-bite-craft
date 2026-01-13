import { ShoppingCart, Minus, Plus, Trash2, X, ClipboardList } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

export const FloatingCart: React.FC = () => {
  const { items, getTotalItems, getTotalPrice, isOpen, setIsOpen, updateQuantity, removeItem } = useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Cart Drawer */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 transition-all duration-300 shadow-2xl",
          isOpen ? "max-h-[80vh]" : "max-h-0 overflow-hidden"
        )}
      >
        {isOpen && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Seu Pedido</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[40vh] overflow-y-auto space-y-3 mb-4">
              {items.map((item, index) => {
                const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
                const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                
                return (
                  <div key={`${item.product.id}-${index}`} className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product.name}</p>
                      {item.extras && item.extras.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.extras.map(e => e.optionName).join(', ')}
                        </p>
                      )}
                      <p className="text-primary font-bold text-sm">
                        {formatCurrency(itemPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                      </button>
                      <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add more items button */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-4 border-2 border-dashed border-muted-foreground/30 rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Adicionar mais itens
              </button>
            </div>

            <button className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <span>Finalizar Pedido</span>
              <span className="font-bold">{formatCurrency(totalPrice)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Button - Redesigned */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground rounded-full px-5 py-3 shadow-lg shadow-primary/30 flex items-center gap-3 hover:bg-primary/90 active:scale-95 transition-all duration-200 animate-scale-in"
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="font-semibold">Ver Pedido</span>
          <span className="font-bold">{formatCurrency(totalPrice)}</span>
        </button>
      )}
    </>
  );
};

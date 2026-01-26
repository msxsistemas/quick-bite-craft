import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, ChevronDown, ChevronRight, Tag, Ticket } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface FloatingCartProps {
  disabled?: boolean;
  nextOpenTime?: string | null;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({ disabled = false, nextOpenTime }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, getTotalItems, getTotalPrice, isOpen, setIsOpen, updateQuantity, clearCart } = useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const [showClosedModal, setShowClosedModal] = useState(false);

  const handleOpenCart = () => {
    if (disabled) {
      setShowClosedModal(true);
      return;
    }
    setIsOpen(true);
  };

  if (totalItems === 0) return null;

  return (
    <>
      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <button onClick={() => setIsOpen(false)} className="p-1">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </button>
            <SheetTitle className="text-base font-bold uppercase tracking-wide">
              Sacola
            </SheetTitle>
            <button 
              onClick={() => clearCart()}
              className="text-sm font-semibold text-destructive"
            >
              Limpar
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Items List */}
            <div className="divide-y divide-border">
              {items.map((item, index) => {
                const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
                const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                
                return (
                  <div key={`${item.product.id}-${index}`} className="px-4 py-4">
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="relative shrink-0">
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                            {item.product.name}
                          </h4>
                          <p className="text-sm font-bold text-foreground shrink-0">
                            {formatCurrency(itemPrice)}
                          </p>
                        </div>

                        {/* Extras with quantity badges */}
                        {item.extras && item.extras.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {item.extras.map((extra, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center justify-center bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium min-w-[18px]">
                                  {extra.quantity || 1}
                                </span>
                                <span className="line-clamp-1">{extra.optionName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic">
                            Observação: {item.notes}
                          </p>
                        )}

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-end mt-3">
                          <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center text-destructive hover:bg-muted transition-colors"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </button>
                            <span className="w-8 text-center font-semibold text-sm text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center text-destructive hover:bg-muted transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add more items */}
            <div className="px-4 py-4 border-b border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-destructive font-semibold text-sm"
              >
                Adicionar mais itens
              </button>
            </div>

            {/* Coupon Section */}
            <div className="px-4 py-4 border-b border-border">
              <button className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-foreground" />
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground">Cupom</p>
                    <p className="text-xs text-muted-foreground">Adicione um código promocional</p>
                  </div>
                </div>
                <span className="text-destructive font-semibold text-sm">Adicionar</span>
              </button>
            </div>

            {/* Available Coupons Banner */}
            <div className="px-4 py-3 bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">
                    Cupons de <span className="text-destructive font-semibold">até R$ 10 off</span> aqui
                  </span>
                </div>
                <button className="text-destructive font-semibold text-sm">Pegar</button>
              </div>
            </div>

            {/* Order Summary */}
            <div className="px-4 py-4">
              <h3 className="font-bold text-foreground mb-4">Resumo de valores</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span className="text-muted-foreground">A calcular</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Bottom padding for footer */}
            <div className="h-32" />
          </div>

          {/* Footer - Fixed */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total com a entrega</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalPrice)}</p>
                  <p className="text-sm text-muted-foreground">/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/r/${slug}/checkout`);
                }}
                className="bg-destructive text-destructive-foreground font-semibold px-8 py-3.5 rounded-lg hover:bg-destructive/90 active:scale-[0.98] transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total sem a entrega</p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(totalPrice)} <span className="text-sm font-normal text-muted-foreground">/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
              </p>
            </div>
            <button
              onClick={handleOpenCart}
              className="bg-destructive text-destructive-foreground font-semibold px-10 py-2.5 rounded-lg hover:bg-destructive/90 active:scale-[0.98] transition-all"
            >
              Ver sacola
            </button>
          </div>
        </div>
      )}

      {/* Closed Store Modal */}
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-muted-foreground">
              Este restaurante abre hoje às
            </p>
            <p className="text-4xl font-bold text-foreground">
              {nextOpenTime || '—'}
            </p>
            <p className="text-muted-foreground">
              Mas você pode olhar o cardápio à vontade e voltar quando ele estiver aberto.
            </p>
            <button
              onClick={() => setShowClosedModal(false)}
              className="w-full mt-4 py-3 rounded-lg font-semibold bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] transition-colors"
            >
              Ok, entendi
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, ChevronDown, Pencil, MessageSquare } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export const FloatingCart: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, getTotalItems, getTotalPrice, isOpen, setIsOpen, updateQuantity, updateItemNotes } = useCart();

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const [editingNotesIndex, setEditingNotesIndex] = useState<number | null>(null);
  const [editingNotesValue, setEditingNotesValue] = useState('');

  if (totalItems === 0) return null;

  const handleEditNotes = (index: number, currentNotes: string | undefined) => {
    setEditingNotesIndex(index);
    setEditingNotesValue(currentNotes || '');
  };

  const handleSaveNotes = () => {
    if (editingNotesIndex !== null) {
      updateItemNotes(editingNotesIndex, editingNotesValue.trim() || undefined);
      setEditingNotesIndex(null);
      setEditingNotesValue('');
    }
  };

  return (
    <>
      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <button onClick={() => setIsOpen(false)}>
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </button>
            <SheetTitle className="text-base font-bold uppercase tracking-wide">
              Sacola
            </SheetTitle>
            <button 
              onClick={() => {
                items.forEach((_, i) => updateQuantity(i, 0));
              }}
              className="text-sm font-medium text-red-500"
            >
              Limpar
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto h-[calc(85vh-140px)] px-4">
            {/* Restaurant Info */}
            <div className="py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Restaurante</p>
                  <button className="text-sm font-medium text-red-500">
                    Adicionar mais itens
                  </button>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="py-4">
              <h3 className="font-bold text-foreground mb-4">Itens adicionados</h3>
              
              {items.map((item, index) => {
                const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
                const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                
                return (
                  <div key={`${item.product.id}-${index}`} className="flex gap-3 py-4 border-b border-border last:border-b-0">
                    {/* Image */}
                    <div className="relative">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm line-clamp-2">{item.product.name}</h4>
                          {item.extras && item.extras.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.extras.map(e => {
                                const qty = e.quantity || 1;
                                return qty > 1 ? `${qty}x ${e.optionName}` : e.optionName;
                              }).join(', ')}
                            </p>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 border border-border rounded-lg ml-2">
                          <button
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-red-500"
                          >
                            {item.quantity === 1 ? (
                              <Trash2 className="w-4 h-4" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                          </button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center text-red-500"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <p className="text-red-500 font-bold text-sm mt-2">
                        {formatCurrency(itemPrice)}
                      </p>

                      {/* Extras list */}
                      {item.extras && item.extras.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {item.extras.map((extra, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                                {extra.quantity || 1}
                              </span>
                              <span>{extra.optionName}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Observação: {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add more items */}
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-4 text-center text-red-500 font-medium"
              >
                Adicionar mais itens
              </button>
            </div>

            {/* Order Summary */}
            <div className="py-4 border-t border-border">
              <h3 className="font-bold text-foreground mb-3">Resumo de valores</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span className="font-medium">A calcular</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-bold">Total</span>
                  <span className="font-bold">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Total com a entrega</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{formatCurrency(totalPrice)}</p>
                <p className="text-sm text-muted-foreground">/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  navigate(`/r/${slug}/checkout`);
                }}
                className="bg-red-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-red-600 active:scale-[0.98] transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent pt-8">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-red-500 text-white rounded-lg py-4 px-6 shadow-lg shadow-red-500/30 flex items-center justify-between hover:bg-red-600 active:scale-[0.99] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/90">Total sem a entrega</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold">{formatCurrency(totalPrice)}</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                Ver sacola
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Edit Notes Dialog */}
      <Dialog open={editingNotesIndex !== null} onOpenChange={() => setEditingNotesIndex(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Observações do item</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingNotesValue}
            onChange={(e) => setEditingNotesValue(e.target.value)}
            placeholder="Ex: Sem cebola, bem passado, etc."
            className="resize-none"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditingNotesIndex(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveNotes}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

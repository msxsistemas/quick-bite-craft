import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, X, ClipboardList, Pencil, MessageSquare } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
                const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
                const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                
                return (
                  <div key={`${item.product.id}-${index}`} className="bg-muted/50 rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      {item.product.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🍽️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product.name}</p>
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.extras.map(e => {
                              const qty = e.quantity || 1;
                              return qty > 1 ? `${qty}x ${e.optionName}` : e.optionName;
                            }).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-primary/70 flex items-center gap-1 mt-1">
                            <MessageSquare className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{item.notes}</span>
                          </p>
                        )}
                        <p className="text-primary font-bold text-sm mt-1">
                          {formatCurrency(itemPrice)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleEditNotes(index, item.notes)}
                        className="text-muted-foreground hover:text-primary p-1"
                        title="Editar observações"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(index, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-4 h-4 text-destructive" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
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

            <button 
              onClick={() => {
                setIsOpen(false);
                navigate(`/r/${slug}/checkout`);
              }}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Finalizar Pedido</span>
              <span className="font-bold">{formatCurrency(totalPrice)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Floating Button */}
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

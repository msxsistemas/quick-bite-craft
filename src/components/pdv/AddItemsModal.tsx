import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Plus, Trash2, Loader2 } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/format';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
}

interface Category {
  id: string;
  name: string;
  emoji?: string | null;
  active: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

interface AddItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  tableName: string;
  products: Product[];
  categories: Category[];
  onConfirmAddItems: (newItems: OrderItem[]) => Promise<void>;
  isProcessing: boolean;
}

export const AddItemsModal = ({
  isOpen,
  onClose,
  order,
  tableName,
  products,
  categories,
  onConfirmAddItems,
  isProcessing,
}: AddItemsModalProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      setCart([]);
      setSelectedCategory('all');
    }
  }, [isOpen]);

  const activeProducts = products.filter(p => p);
  const filteredProducts = selectedCategory === 'all'
    ? activeProducts
    : activeProducts.filter(p => p.category === selectedCategory);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  const handleConfirm = async () => {
    const newItems: OrderItem[] = cart.map(item => ({
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      quantity: item.quantity,
    }));
    await onConfirmAddItems(newItems);
  };

  if (!order) return null;

  // Parse existing items
  const existingItems = Array.isArray(order.items) ? order.items as unknown as OrderItem[] : [];
  const existingTotal = existingItems.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            {tableName} - Adicionar Itens ao Pedido #{order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Products */}
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory('all')}
              >
                Todos
              </Button>
              {categories.filter(c => c.active).map(cat => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.emoji} {cat.name}
                </Button>
              ))}
            </div>

            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-2 pr-4">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-sm text-primary font-semibold">{formatCurrency(product.price)}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Cart & Summary */}
          <div className="space-y-4 border-l pl-6">
            {/* Existing Items */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Itens Existentes</Label>
              <ScrollArea className="h-[120px] border rounded-lg p-2 bg-muted/30">
                {existingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum item no pedido
                  </p>
                ) : (
                  <div className="space-y-1">
                    {existingItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="truncate">{item.quantity}x {item.productName}</span>
                        <span>{formatCurrency(item.productPrice * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal existente:</span>
                <span>{formatCurrency(existingTotal)}</span>
              </div>
            </div>

            {/* New Items */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Novos Itens
              </Label>
              <ScrollArea className="h-[150px] border rounded-lg p-2">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Clique nos produtos para adicionar
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex-1 truncate">{item.productName}</span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <span className="w-20 text-right">{formatCurrency(item.productPrice * item.quantity)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Total */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal existente:</span>
                <span>{formatCurrency(existingTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-600">
                <span>Novos itens:</span>
                <span>+ {formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Novo Total:</span>
                <span>{formatCurrency(existingTotal + cartTotal + order.tip_amount - order.discount)}</span>
              </div>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={cart.length === 0 || isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Adicionar {cart.length} {cart.length === 1 ? 'Item' : 'Itens'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

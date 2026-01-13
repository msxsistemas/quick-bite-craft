import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PublicProduct } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';

interface ProductDetailSheetProps {
  product: PublicProduct | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const totalPrice = product.price * quantity;

  const handleAddToCart = () => {
    // Convert to cart-compatible format
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image_url || '',
      categoryId: product.category || '',
      isAvailable: true,
    };
    addItem(cartProduct, quantity);
    onClose();
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] flex flex-col gap-0 rounded-2xl">
        {/* Product Image */}
        <div className="relative flex-shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-52 object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 bg-foreground/50 rounded-full flex items-center justify-center text-background hover:bg-foreground/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Product Info */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
            )}
            <p className="text-primary font-bold text-lg mt-2">{formatCurrency(product.price)}</p>
          </div>

          {/* TODO: Add extras/options selection when extra_groups are fetched */}
        </div>

        {/* Bottom Actions */}
        <div className="p-5 border-t border-border bg-background flex-shrink-0">
          {/* Quantity Selector */}
          <div className="flex items-center justify-center gap-6 mb-4">
            <button
              onClick={decrementQuantity}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-xl font-bold text-foreground w-8 text-center">{quantity}</span>
            <button
              onClick={incrementQuantity}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-full hover:bg-primary/90 active:scale-[0.98] transition-all duration-200"
          >
            Adicionar • {formatCurrency(totalPrice)}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

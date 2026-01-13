import React, { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Product } from '@/types/delivery';
import { formatCurrency } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

interface ProductDetailSheetProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock options for demonstration
const meatOptions = [
  { id: 'rare', label: 'Mal Passado' },
  { id: 'medium', label: 'Ao Ponto' },
  { id: 'well-done', label: 'Bem Passado' },
];

const extras = [
  { id: 'bacon', label: 'Bacon Extra', price: 5.00 },
  { id: 'cheese', label: 'Queijo Extra', price: 4.00 },
  { id: 'egg', label: 'Ovo', price: 3.00 },
  { id: 'onion-rings', label: 'Onion Rings', price: 8.00 },
];

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedMeatOption, setSelectedMeatOption] = useState('medium');
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  if (!product) return null;

  const extrasTotal = selectedExtras.reduce((total, extraId) => {
    const extra = extras.find(e => e.id === extraId);
    return total + (extra?.price || 0);
  }, 0);

  const totalPrice = (product.price + extrasTotal) * quantity;

  const handleAddToCart = () => {
    addItem(product, quantity);
    onClose();
    setQuantity(1);
    setSelectedMeatOption('medium');
    setSelectedExtras([]);
  };

  const toggleExtra = (extraId: string) => {
    setSelectedExtras(prev =>
      prev.includes(extraId)
        ? prev.filter(id => id !== extraId)
        : [...prev, extraId]
    );
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-3xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-56 object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* Product Info */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-foreground">{product.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
              <p className="text-primary font-bold text-lg mt-2">{formatCurrency(product.price)}</p>
            </div>

            {/* Meat Option - Required */}
            {product.hasOptions && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">Ponto da Carne</h3>
                    <p className="text-xs text-muted-foreground">Escolha o ponto ideal</p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground text-xs">Obrigatório</Badge>
                </div>
                
                <div className="space-y-3">
                  {meatOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center justify-between py-2 cursor-pointer"
                    >
                      <span className="text-foreground">{option.label}</span>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedMeatOption === option.id
                            ? 'border-primary bg-primary'
                            : 'border-border'
                        }`}
                        onClick={() => setSelectedMeatOption(option.id)}
                      >
                        {selectedMeatOption === option.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Extras - Optional */}
            <div className="mb-6">
              <div className="mb-3">
                <h3 className="font-semibold text-foreground">Adicionais</h3>
                <p className="text-xs text-muted-foreground">Turbine seu pedido</p>
              </div>
              
              <div className="space-y-3">
                {extras.map((extra) => (
                  <label
                    key={extra.id}
                    className="flex items-center justify-between py-2 cursor-pointer"
                  >
                    <div>
                      <span className="text-foreground">{extra.label}</span>
                      <span className="text-primary text-sm ml-2">+ {formatCurrency(extra.price)}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedExtras.includes(extra.id)
                          ? 'border-primary bg-primary'
                          : 'border-border'
                      }`}
                      onClick={() => toggleExtra(extra.id)}
                    >
                      {selectedExtras.includes(extra.id) && (
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-5 border-t border-border bg-background">
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
        </div>
      </SheetContent>
    </Sheet>
  );
};

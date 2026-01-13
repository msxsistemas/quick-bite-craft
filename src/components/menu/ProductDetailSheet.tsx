import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PublicProduct, PublicExtraGroup } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ProductDetailSheetProps {
  product: PublicProduct | null;
  extraGroups: PublicExtraGroup[];
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedExtra {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
}

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product,
  extraGroups,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedExtras([]);
  }, [product?.id]);

  if (!product) return null;

  // Filter extra groups that are linked to this product
  const productExtraGroups = extraGroups.filter(group => 
    product.extra_groups?.includes(group.id)
  );

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);
  const itemPrice = product.price + extrasTotal;
  const totalPrice = itemPrice * quantity;

  const handleExtraToggle = (group: PublicExtraGroup, optionId: string, optionName: string, price: number) => {
    setSelectedExtras(prev => {
      const existingIndex = prev.findIndex(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existingIndex >= 0) {
        // Remove if already selected
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      // For single selection groups (max_selections = 1), replace existing
      if (group.max_selections === 1) {
        const filtered = prev.filter(e => e.groupId !== group.id);
        return [...filtered, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price }];
      }
      
      // For multi-selection, check if we've reached max
      const currentGroupSelections = prev.filter(e => e.groupId === group.id).length;
      if (currentGroupSelections >= group.max_selections) {
        return prev;
      }
      
      return [...prev, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price }];
    });
  };

  const isOptionSelected = (groupId: string, optionId: string) => {
    return selectedExtras.some(e => e.groupId === groupId && e.optionId === optionId);
  };

  const isRequiredGroupsFilled = () => {
    for (const group of productExtraGroups) {
      if (group.required) {
        const hasSelection = selectedExtras.some(e => e.groupId === group.id);
        if (!hasSelection) return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    const cartProduct = {
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price,
      image: product.image_url || '',
      categoryId: product.category || '',
      isAvailable: true,
    };
    addItem(cartProduct, quantity, selectedExtras);
    onClose();
    setQuantity(1);
    setSelectedExtras([]);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const canAddToCart = isRequiredGroupsFilled();

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

          {/* Extra Groups */}
          {productExtraGroups.map(group => (
            <div key={group.id} className="mb-6 border-t border-border pt-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{group.display_title}</h3>
                  {group.subtitle && (
                    <p className="text-sm text-muted-foreground">{group.subtitle}</p>
                  )}
                </div>
                {group.required && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium">
                    Obrigatório
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {group.max_selections === 1 
                  ? 'Escolha 1 opção' 
                  : `Escolha até ${group.max_selections} opções`}
              </p>
              
              <div className="space-y-2">
                {group.options.map(option => {
                  const isSelected = isOptionSelected(group.id, option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleExtraToggle(group, option.id, option.name, option.price)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span className="text-foreground">{option.name}</span>
                      </div>
                      {option.price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          + {formatCurrency(option.price)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
            disabled={!canAddToCart}
            className={`w-full font-semibold py-4 rounded-full transition-all duration-200 ${
              canAddToCart 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {canAddToCart 
              ? `Adicionar • ${formatCurrency(totalPrice)}` 
              : 'Selecione as opções obrigatórias'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

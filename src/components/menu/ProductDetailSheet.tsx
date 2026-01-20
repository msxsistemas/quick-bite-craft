import React, { useState, useEffect } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';
import { PublicProduct, PublicExtraGroup } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { Textarea } from '@/components/ui/textarea';

export interface ProductDetailSheetProps {
  product: PublicProduct | null;
  extraGroups: PublicExtraGroup[];
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
}

interface SelectedExtra {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
  quantity: number;
}

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({
  product,
  extraGroups,
  isOpen,
  onClose,
  disabled = false,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [notes, setNotes] = useState('');

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedExtras([]);
    setNotes('');
  }, [product?.id]);

  if (!product) return null;

  // Filter extra groups that are linked to this product
  const productExtraGroups = extraGroups.filter(group => 
    product.extra_groups?.includes(group.id)
  );

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
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
        return [...filtered, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
      }
      
      // For multi-selection, check if we've reached max
      const currentGroupSelections = prev.filter(e => e.groupId === group.id).length;
      if (currentGroupSelections >= group.max_selections) {
        return prev;
      }
      
      return [...prev, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
    });
  };

  const handleExtraQuantityChange = (groupId: string, optionId: string, delta: number) => {
    setSelectedExtras(prev => {
      return prev.map(extra => {
        if (extra.groupId === groupId && extra.optionId === optionId) {
          const newQuantity = extra.quantity + delta;
          if (newQuantity <= 0) {
            return null; // Will be filtered out
          }
          return { ...extra, quantity: newQuantity };
        }
        return extra;
      }).filter(Boolean) as SelectedExtra[];
    });
  };

  const addExtraWithQuantity = (group: PublicExtraGroup, optionId: string, optionName: string, price: number) => {
    setSelectedExtras(prev => {
      const existing = prev.find(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existing) {
        // Increment quantity
        return prev.map(e => 
          e.groupId === group.id && e.optionId === optionId 
            ? { ...e, quantity: e.quantity + 1 }
            : e
        );
      }
      
      // Add new
      return [...prev, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
    });
  };

  const getExtraQuantity = (groupId: string, optionId: string) => {
    const extra = selectedExtras.find(e => e.groupId === groupId && e.optionId === optionId);
    return extra?.quantity || 0;
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
    addItem(cartProduct, quantity, selectedExtras, notes.trim() || undefined);
    onClose();
    setQuantity(1);
    setSelectedExtras([]);
    setNotes('');
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  const canAddToCart = isRequiredGroupsFilled() && !disabled;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[99%] max-w-md bg-background rounded-2xl animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[90vh] overflow-hidden">
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
                {group.allow_repeat 
                  ? 'Adicione quantos quiser'
                  : group.max_selections === 1 
                    ? 'Escolha 1 opção' 
                    : `Escolha até ${group.max_selections} opções`}
              </p>
              
              <div className="space-y-2">
                {group.options.map(option => {
                  const isSelected = isOptionSelected(group.id, option.id);
                  const optionQuantity = getExtraQuantity(group.id, option.id);
                  
                  // Render with quantity controls if allow_repeat is enabled
                  if (group.allow_repeat) {
                    return (
                      <div
                        key={option.id}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          optionQuantity > 0 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                      >
                        <div className="flex-1">
                          <span className="text-foreground">{option.name}</span>
                          {option.price > 0 && (
                            <span className="text-sm text-muted-foreground ml-2">
                              + {formatCurrency(option.price)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {optionQuantity > 0 ? (
                            <>
                              <button
                                onClick={() => handleExtraQuantityChange(group.id, option.id, -1)}
                                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-6 text-center font-semibold text-foreground">{optionQuantity}</span>
                              <button
                                onClick={() => addExtraWithQuantity(group, option.id, option.name, option.price)}
                                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => addExtraWithQuantity(group, option.id, option.name, option.price)}
                              className="w-8 h-8 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }
                  
                  // Standard checkbox/radio style
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

          {/* Notes/Observations */}
          <div className="mb-4 border-t border-border pt-4">
            <h3 className="font-semibold text-foreground mb-2">Observações</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Sem cebola, bem passado, etc."
              className="resize-none"
              rows={2}
            />
          </div>
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
            {disabled
              ? '🔒 Restaurante fechado'
              : canAddToCart 
                ? `Adicionar • ${formatCurrency(totalPrice)}` 
                : 'Selecione as opções obrigatórias'}
          </button>
        </div>
      </div>
    </div>
  );
};

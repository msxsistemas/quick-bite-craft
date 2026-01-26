import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Share2, Minus, Plus, Check } from 'lucide-react';
import { PublicProduct, PublicExtraGroup } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export interface ProductDetailSheetProps {
  product: PublicProduct | null;
  extraGroups: PublicExtraGroup[];
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
  restaurantLogo?: string | null;
  restaurantName?: string;
  nextOpenTime?: string | null;
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
  restaurantLogo,
  restaurantName,
  nextOpenTime,
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [notes, setNotes] = useState('');
  
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when product changes
  useEffect(() => {
    setQuantity(1);
    setSelectedExtras([]);
    setNotes('');
  }, [product?.id]);

  // Filter extra groups that are linked to this product
  const productExtraGroups = useMemo(() => {
    if (!product) return [];
    return extraGroups.filter(group => 
      product.extra_groups?.includes(group.id)
    );
  }, [product, extraGroups]);


  if (!product) return null;

  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
  const itemPrice = product.price + extrasTotal;
  const totalPrice = itemPrice * quantity;


  const scrollToNextGroup = (currentGroupId: string) => {
    const currentIndex = productExtraGroups.findIndex(g => g.id === currentGroupId);
    const nextGroup = productExtraGroups[currentIndex + 1];
    if (nextGroup) {
      setTimeout(() => {
        const element = document.getElementById(`extra-group-${nextGroup.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleExtraToggle = (group: PublicExtraGroup, optionId: string, optionName: string, price: number) => {
    setSelectedExtras(prev => {
      const existingIndex = prev.findIndex(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existingIndex >= 0) {
        // Remove if already selected - don't scroll
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      // For single selection groups (max_selections = 1), replace existing and scroll
      if (group.max_selections === 1) {
        const filtered = prev.filter(e => e.groupId !== group.id);
        scrollToNextGroup(group.id);
        return [...filtered, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
      }
      
      // For multi-selection, check if we've reached max
      const currentGroupSelections = prev.filter(e => e.groupId === group.id).length;
      if (currentGroupSelections >= group.max_selections) {
        return prev;
      }
      
      // If this selection completes the group, scroll to next
      if (currentGroupSelections + 1 >= group.max_selections) {
        scrollToNextGroup(group.id);
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
      // Calculate total quantity for this group
      const currentGroupTotal = prev
        .filter(e => e.groupId === group.id)
        .reduce((sum, e) => sum + e.quantity, 0);
      
      // Check if we've reached max selections
      if (currentGroupTotal >= group.max_selections) {
        return prev;
      }
      
      const existing = prev.find(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existing) {
        // Increment quantity (already checked max above)
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
    if (disabled) {
      setShowClosedModal(true);
      return;
    }
    
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


  const canAddToCart = isRequiredGroupsFilled();
  const isButtonDisabled = !canAddToCart && !disabled;

  if (!isOpen) return null;

  const MAX_NOTES_LENGTH = 140;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-200" style={{ overflow: 'hidden' }}>
      {/* Product Image - Compact height like iFood */}
      {product.image_url && (
        <div className="relative w-full h-[32vh] flex-shrink-0">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {/* Back button on image */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          
          {/* Restaurant badge overlay - temporarily hidden */}
        </div>
      )}

      {/* Content - Bottom Sheet Style with overlap */}
      <div className={`flex-1 bg-background flex flex-col ${product.image_url ? 'rounded-t-[20px] -mt-5 relative z-10' : ''}`} style={{ overflow: 'hidden' }}>
        {/* Header without image */}
        {!product.image_url && (
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: product.description || '',
                  });
                }
              }}
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="px-4 pt-5 pb-4">
            {/* Product Info */}
            <div className="mb-5 ml-1">
              <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-snug font-normal tracking-normal">{product.description}</p>
              )}
              <p className="text-foreground mt-2 text-sm">Serve até 1 pessoa</p>
              <p className="text-lg font-semibold text-foreground mt-3">{formatCurrency(product.price)}</p>
            </div>

            {/* Extra Groups - Always expanded (iFood style) */}
            <div className="mx-1">
            {productExtraGroups.map(group => {
              const groupSelectedCount = selectedExtras
                .filter(e => e.groupId === group.id)
                .reduce((sum, e) => sum + e.quantity, 0);
              const isGroupComplete = groupSelectedCount >= group.max_selections;
              
              return (
                <div key={group.id} id={`extra-group-${group.id}`} className="mb-2">
                  {/* Group Header */}
                  <div className="flex items-center justify-between py-4 bg-[#f5f0eb] px-4 -mx-1">
                    <div className="text-left">
                      <h3 className="font-semibold text-[#3e3e3e]">{group.display_title}</h3>
                      <p className="text-sm text-[#717171]">
                        {group.max_selections === 1 
                          ? 'Escolha 1 opção' 
                          : `Escolha de 1 a ${group.max_selections}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isGroupComplete ? (
                        <Check className="w-6 h-6 text-green-600" />
                      ) : group.required ? (
                        <span className="text-xs bg-foreground text-background px-2 py-1 rounded font-medium">
                          OBRIGATÓRIO
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  {/* Group Options */}
                  <div className="py-1">
                    {group.options.map(option => {
                      const isSelected = isOptionSelected(group.id, option.id);
                      const optionQuantity = getExtraQuantity(group.id, option.id);
                        
                        // Calculate if max is reached for this group
                        const currentGroupTotal = selectedExtras
                          .filter(e => e.groupId === group.id)
                          .reduce((sum, e) => sum + e.quantity, 0);
                        const isMaxReached = currentGroupTotal >= group.max_selections;
                        
                        // Render with quantity controls if allow_repeat is enabled (iFood style)
                        if (group.allow_repeat) {
                          return (
                            <div
                              key={option.id}
                              className="w-full flex items-center justify-between py-4 border-b border-border last:border-b-0"
                            >
                              <div className="flex-1">
                                <span className="text-foreground">{option.name}</span>
                                {option.price > 0 && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    + {formatCurrency(option.price)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center">
                                {optionQuantity > 0 ? (
                                  <div className="flex items-center gap-0">
                                    <button
                                      onClick={() => handleExtraQuantityChange(group.id, option.id, -1)}
                                      className="w-10 h-10 flex items-center justify-center text-primary"
                                    >
                                      <Minus className="w-5 h-5" />
                                    </button>
                                    <span className="w-8 text-center font-semibold text-foreground">{optionQuantity}</span>
                                    <button
                                      onClick={() => addExtraWithQuantity(group, option.id, option.name, option.price)}
                                      disabled={isMaxReached}
                                      className={`w-10 h-10 flex items-center justify-center transition-colors ${
                                        isMaxReached
                                          ? 'text-muted-foreground cursor-not-allowed'
                                          : 'text-primary'
                                      }`}
                                    >
                                      <Plus className="w-5 h-5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addExtraWithQuantity(group, option.id, option.name, option.price)}
                                    disabled={isMaxReached}
                                    className={`w-10 h-10 flex items-center justify-center transition-colors ${
                                      isMaxReached
                                        ? 'text-muted-foreground cursor-not-allowed'
                                        : 'text-primary'
                                    }`}
                                  >
                                    <Plus className="w-5 h-5" />
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
                            className="w-full flex items-center justify-between py-4 border-b border-border last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-foreground">{option.name}</span>
                              {option.price > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  + {formatCurrency(option.price)}
                                </span>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected 
                                ? 'border-primary bg-primary' 
                                : 'border-primary'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
            </div>

            {/* Notes/Observations - iFood style */}
            <div className="mt-5 mx-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs">💬</span>
                  <span className="text-sm text-foreground">Alguma observação?</span>
                </div>
                <span className="text-sm text-muted-foreground">{notes.length}/{MAX_NOTES_LENGTH}</span>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_NOTES_LENGTH) {
                    setNotes(e.target.value);
                  }
                }}
                placeholder="Ex: tirar a cebola, maionese à parte etc."
                className="resize-none border border-muted-foreground/20 rounded-lg bg-background min-h-[70px] focus-visible:ring-0 focus-visible:ring-offset-0 p-3"
                rows={2}
                maxLength={MAX_NOTES_LENGTH}
              />
            </div>
          </div>
        </div>

        {/* Bottom Fixed Action - iFood style */}
        <div className="p-4 border-t border-border bg-background flex-shrink-0 safe-area-bottom">
          <div className="flex items-center gap-4">
            {/* Quantity Controls - Left side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-semibold text-foreground w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Add Button - Right side */}
            <button
              onClick={handleAddToCart}
              disabled={isButtonDisabled}
              className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-between px-4 ${
                isButtonDisabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] active:scale-[0.98]'
              }`}
            >
              <span>
                {disabled
                  ? '🔒 Fechado'
                  : canAddToCart 
                    ? 'Adicionar' 
                    : 'Selecione'}
              </span>
              <span>{formatCurrency(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
};

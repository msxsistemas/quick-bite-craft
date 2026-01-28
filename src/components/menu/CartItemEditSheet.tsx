import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Minus, Plus, Check, Trash2 } from 'lucide-react';
import { PublicExtraGroup } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { CartItem, CartItemExtra } from '@/types/delivery';
import { Textarea } from '@/components/ui/textarea';

export interface CartItemEditSheetProps {
  cartItem: CartItem | null;
  cartItemIndex: number;
  extraGroups: PublicExtraGroup[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemIndex: number, quantity: number, extras?: CartItemExtra[], notes?: string) => void;
  onRemove: (itemIndex: number) => void;
}

interface SelectedExtra {
  groupId: string;
  groupTitle: string;
  optionId: string;
  optionName: string;
  price: number;
  quantity: number;
}

export const CartItemEditSheet: React.FC<CartItemEditSheetProps> = ({
  cartItem,
  cartItemIndex,
  extraGroups,
  isOpen,
  onClose,
  onSave,
  onRemove,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [notes, setNotes] = useState('');

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

  // Initialize state when cartItem changes
  useEffect(() => {
    if (cartItem) {
      setQuantity(cartItem.quantity);
      setNotes(cartItem.notes || '');
      // Convert CartItemExtra[] to SelectedExtra[]
      setSelectedExtras(
        cartItem.extras?.map(e => ({
          groupId: e.groupId,
          groupTitle: e.groupTitle,
          optionId: e.optionId,
          optionName: e.optionName,
          price: e.price,
          quantity: e.quantity || 1,
        })) || []
      );
    }
  }, [cartItem]);

  // Filter extra groups that are linked to this product
  const productExtraGroups = useMemo(() => {
    if (!cartItem) return [];
    // Use all extra groups linked to this product
    const productExtraGroupIds = cartItem.product.extra_groups || [];
    if (productExtraGroupIds.length > 0) {
      return extraGroups.filter(group => productExtraGroupIds.includes(group.id));
    }
    // Fallback: show groups that are already selected
    const usedGroupIds = new Set(cartItem.extras?.map(e => e.groupId) || []);
    return extraGroups.filter(group => usedGroupIds.has(group.id));
  }, [cartItem, extraGroups]);

  console.log('CartItemEditSheet render:', { cartItem: cartItem?.product?.name, isOpen });
  if (!cartItem || !isOpen) return null;

  const product = cartItem.product;
  const extrasTotal = selectedExtras.reduce((sum, extra) => sum + (extra.price * extra.quantity), 0);
  const itemPrice = product.price + extrasTotal;
  const totalPrice = itemPrice * quantity;

  const handleExtraQuantityChange = (groupId: string, optionId: string, delta: number) => {
    setSelectedExtras(prev => {
      return prev.map(extra => {
        if (extra.groupId === groupId && extra.optionId === optionId) {
          const newQuantity = extra.quantity + delta;
          if (newQuantity <= 0) {
            return null;
          }
          return { ...extra, quantity: newQuantity };
        }
        return extra;
      }).filter(Boolean) as SelectedExtra[];
    });
  };

  const addExtraWithQuantity = (group: PublicExtraGroup, optionId: string, optionName: string, price: number) => {
    setSelectedExtras(prev => {
      const currentGroupTotal = prev
        .filter(e => e.groupId === group.id)
        .reduce((sum, e) => sum + e.quantity, 0);
      
      if (currentGroupTotal >= group.max_selections) {
        return prev;
      }
      
      const existing = prev.find(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existing) {
        return prev.map(e => 
          e.groupId === group.id && e.optionId === optionId 
            ? { ...e, quantity: e.quantity + 1 }
            : e
        );
      }
      
      return [...prev, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
    });
  };

  const handleExtraToggle = (group: PublicExtraGroup, optionId: string, optionName: string, price: number) => {
    setSelectedExtras(prev => {
      const existingIndex = prev.findIndex(e => e.groupId === group.id && e.optionId === optionId);
      
      if (existingIndex >= 0) {
        return prev.filter((_, i) => i !== existingIndex);
      }
      
      if (group.max_selections === 1) {
        const filtered = prev.filter(e => e.groupId !== group.id);
        return [...filtered, { groupId: group.id, groupTitle: group.display_title, optionId, optionName, price, quantity: 1 }];
      }
      
      const currentGroupSelections = prev.filter(e => e.groupId === group.id).length;
      if (currentGroupSelections >= group.max_selections) {
        return prev;
      }
      
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

  const handleSave = () => {
    onSave(cartItemIndex, quantity, selectedExtras, notes.trim() || undefined);
    onClose();
  };

  const handleRemove = () => {
    onRemove(cartItemIndex);
    onClose();
  };

  const MAX_NOTES_LENGTH = 140;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-200 pointer-events-auto">
      {/* Product Image */}
      {product.image && (
        <div className="relative w-full h-[32vh] flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-background flex items-center justify-center shadow-lg"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 bg-background flex flex-col overflow-hidden ${product.image ? 'rounded-t-[20px] -mt-5 relative z-10' : ''}`}>
        {/* Header without image */}
        {!product.image && (
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <span className="text-base font-bold">Editar item</span>
            <div className="w-10" />
          </div>
        )}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="px-4 pt-5 pb-4">
            {/* Product Info */}
            <div className="mb-5 ml-1">
              <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-snug">{product.description}</p>
              )}
              <p className="text-lg font-semibold text-foreground mt-3">{formatCurrency(product.price)}</p>
            </div>

            {/* Extra Groups */}
            <div className="mx-1">
              {productExtraGroups.map(group => {
                const groupSelectedCount = selectedExtras
                  .filter(e => e.groupId === group.id)
                  .reduce((sum, e) => sum + e.quantity, 0);
                const isGroupComplete = groupSelectedCount >= group.max_selections;
                const currentGroupTotal = selectedExtras
                  .filter(e => e.groupId === group.id)
                  .reduce((sum, e) => sum + e.quantity, 0);
                const isMaxReached = currentGroupTotal >= group.max_selections;
                
                return (
                  <div key={group.id} className="mb-2">
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
                                      className="w-10 h-10 flex items-center justify-center text-[hsl(221,83%,53%)]"
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
                                          : 'text-[hsl(221,83%,53%)]'
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
                                        : 'text-[hsl(221,83%,53%)]'
                                    }`}
                                  >
                                    <Plus className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        }
                        
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
                                ? 'border-[hsl(221,83%,53%)] bg-[hsl(221,83%,53%)]' 
                                : 'border-muted-foreground/50'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes */}
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

        {/* Bottom Fixed Action */}
        <div className="p-4 border-t border-border bg-background flex-shrink-0 safe-area-bottom">
          <div className="flex items-center gap-4">
            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="w-12 h-12 rounded-lg border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            {/* Quantity Controls */}
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

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="flex-1 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] active:scale-[0.98]"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

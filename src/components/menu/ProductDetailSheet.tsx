import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Share2, X, Minus, Plus, Check, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { PublicProduct, PublicExtraGroup } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface ProductDetailSheetProps {
  product: PublicProduct | null;
  extraGroups: PublicExtraGroup[];
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
  restaurantLogo?: string | null;
  restaurantName?: string;
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
}) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedExtras, setSelectedExtras] = useState<SelectedExtra[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
    setSearchQuery('');
    // Expand all groups by default
    if (product?.extra_groups) {
      const productExtraGroupIds = extraGroups
        .filter(group => product.extra_groups?.includes(group.id))
        .map(g => g.id);
      setExpandedGroups(new Set(productExtraGroupIds));
    }
  }, [product?.id, product?.extra_groups, extraGroups]);

  // Filter extra groups that are linked to this product
  const productExtraGroups = useMemo(() => {
    if (!product) return [];
    return extraGroups.filter(group => 
      product.extra_groups?.includes(group.id)
    );
  }, [product, extraGroups]);

  // Filter options based on search query
  const filteredExtraGroups = useMemo(() => {
    if (!searchQuery.trim()) return productExtraGroups;
    
    const query = searchQuery.toLowerCase();
    return productExtraGroups.map(group => ({
      ...group,
      options: group.options.filter(option => 
        option.name.toLowerCase().includes(query)
      )
    })).filter(group => group.options.length > 0);
  }, [productExtraGroups, searchQuery]);

  if (!product) return null;

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

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const canAddToCart = isRequiredGroupsFilled() && !disabled;

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

        {/* Content - No scrolling */}
        <div className="flex-1" style={{ overflow: 'hidden' }}>
          <div className="px-4 pt-5">
            {/* Product Info */}
            <div className="mb-5 ml-1">
              <h1 className="text-xl font-bold text-foreground">{product.name}</h1>
              {product.description && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{product.description}</p>
              )}
              <p className="text-foreground mt-2 text-sm">Serve até 1 pessoa</p>
              <p className="text-lg font-semibold text-foreground mt-3">{formatCurrency(product.price)}</p>
            </div>

            {/* Search Field for Extras */}
            {productExtraGroups.length > 0 && (
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Pesquise pelo nome"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-muted/50 border-0"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Extra Groups - Collapsible */}
            <div className="mx-1">
            {filteredExtraGroups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              
              return (
                <Collapsible
                  key={group.id}
                  open={isExpanded}
                  onOpenChange={() => toggleGroupExpanded(group.id)}
                  className="mb-4"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{group.display_title}</h3>
                        <p className="text-sm text-primary">
                          {group.allow_repeat 
                            ? 'Escolha até 3 itens'
                            : group.max_selections === 1 
                              ? 'Escolha 1 opção' 
                              : `Escolha até ${group.max_selections} itens`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.required && (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-medium">
                            Obrigatório
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-primary" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="py-3 space-y-2">
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
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
            </div>

            {/* Notes/Observations - iFood style */}
            <div className="mt-5 mx-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💬</span>
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
              disabled={!canAddToCart}
              className={`flex-1 font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-between px-4 ${
                canAddToCart 
                  ? 'bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)] active:scale-[0.98]' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
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
    </div>
  );
};

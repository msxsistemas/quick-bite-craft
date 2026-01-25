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
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  if (!product) return null;

  // Filter extra groups that are linked to this product
  const productExtraGroups = extraGroups.filter(group => 
    product.extra_groups?.includes(group.id)
  );

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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5">
          {/* Product Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{product.name}</h1>
            <p className="text-lg font-semibold text-foreground mt-1">{formatCurrency(product.price)}</p>
            {product.description && (
              <p className="text-muted-foreground mt-2">{product.description}</p>
            )}
          </div>

          {/* Search Field */}
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

          {/* Notes/Observations */}
          <div className="mt-6">
            <h3 className="font-semibold text-foreground mb-3">Observações</h3>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: Tirar cebola, ovo, etc."
              className="resize-none bg-muted/30 border-border min-h-[100px]"
              rows={4}
            />
          </div>
        </div>
      </div>

      {/* Bottom Fixed Action */}
      <div className="p-4 border-t border-border bg-background flex-shrink-0 safe-area-bottom">
        <button
          onClick={handleAddToCart}
          disabled={!canAddToCart}
          className={`w-full font-semibold py-4 rounded-lg transition-all duration-200 ${
            canAddToCart 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]' 
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {disabled
            ? '🔒 Restaurante fechado'
            : canAddToCart 
              ? 'Avançar' 
              : 'Selecione as opções obrigatórias'}
        </button>
      </div>
    </div>
  );
};

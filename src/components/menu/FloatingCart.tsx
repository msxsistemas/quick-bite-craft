import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, Trash2, ChevronDown, Tag, TicketPercent, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { usePublicCoupons } from '@/hooks/usePublicCoupons';
import { ValidateCouponResult } from '@/hooks/useCoupons';
import { CouponSheet } from './CouponSheet';
import { CartItemEditSheet } from './CartItemEditSheet';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { CartItem } from '@/types/delivery';

interface FloatingCartProps {
  disabled?: boolean;
  nextOpenTime?: string | null;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({ disabled = false, nextOpenTime }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { items, getTotalItems, getTotalPrice, isOpen, setIsOpen, updateQuantity, updateItem, removeItem, clearCart } = useCart();
  const { restaurant } = useRestaurantBySlug(slug);
  const { extraGroups } = usePublicMenu(restaurant?.id);
  const { coupons: availableCoupons, maxDiscount, maxPercentDiscount, hasCoupons } = usePublicCoupons(restaurant?.id);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [showCouponSheet, setShowCouponSheet] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResult | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  
  // Edit item state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number>(-1);

  const handleOpenCart = () => {
    if (disabled) {
      setShowClosedModal(true);
      return;
    }
    setIsOpen(true);
  };

  const handleApplyCoupon = (result: ValidateCouponResult, code: string) => {
    setAppliedCoupon(result);
    setAppliedCouponCode(code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponCode('');
  };

  // Calculate discount
  const calculateDiscount = () => {
    if (!appliedCoupon || !appliedCoupon.valid) return 0;
    
    if (appliedCoupon.discount_type === 'percent') {
      return (totalPrice * (appliedCoupon.discount_value || 0)) / 100;
    }
    return appliedCoupon.discount_value || 0;
  };

  const discount = calculateDiscount();
  const finalTotal = Math.max(0, totalPrice - discount);

  // Get banner text
  const getBannerText = () => {
    if (maxDiscount > 0) {
      return `até ${formatCurrency(maxDiscount)} off`;
    }
    if (maxPercentDiscount > 0) {
      return `até ${maxPercentDiscount}% off`;
    }
    return 'disponíveis';
  };

  const handleEditItem = (item: CartItem, index: number) => {
    setEditingItem(item);
    setEditingItemIndex(index);
  };

  const handleSaveEditedItem = (itemIndex: number, quantity: number, extras?: typeof editingItem.extras, notes?: string) => {
    updateItem(itemIndex, quantity, extras, notes);
    setEditingItem(null);
    setEditingItemIndex(-1);
    // Ensure cart sheet stays open
    setIsOpen(true);
  };

  const handleRemoveEditedItem = (itemIndex: number) => {
    removeItem(itemIndex);
    setEditingItem(null);
    setEditingItemIndex(-1);
    // Ensure cart sheet stays open
    setIsOpen(true);
  };

  const handleCloseEditSheet = () => {
    setEditingItem(null);
    setEditingItemIndex(-1);
    // Ensure cart sheet stays open
    setIsOpen(true);
  };

  if (totalItems === 0) return null;

  return (
    <>
      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-full rounded-none p-0 flex flex-col" hideCloseButton>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
            <button onClick={() => setIsOpen(false)} className="p-1">
              <ChevronDown className="w-6 h-6 text-muted-foreground" />
            </button>
            <SheetTitle className="text-base font-bold uppercase tracking-wide">
              Sacola
            </SheetTitle>
            <button 
              onClick={() => clearCart()}
              className="text-sm font-semibold text-[hsl(221,83%,53%)]"
            >
              Limpar
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Restaurant Info */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                {/* Logo */}
                {restaurant?.logo ? (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-12 h-12 rounded-lg object-cover border border-border"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                    <span className="text-lg font-bold text-muted-foreground">
                      {restaurant?.name?.charAt(0) || 'R'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{restaurant?.name || 'Restaurante'}</h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-semibold text-[hsl(221,83%,53%)]"
                  >
                    Adicionar mais itens
                  </button>
                </div>
              </div>
            </div>

            {/* Itens adicionados Section */}
            <div className="px-4 pt-4 pb-2">
              <h3 className="font-bold text-foreground text-base">Itens adicionados</h3>
            </div>

            {/* Items List */}
            <div className="divide-y divide-border">
              {items.map((item, index) => {
                const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
                const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                
                return (
                  <div key={`${item.product.id}-${index}`} className="px-4 py-4">
                    <div className="flex gap-3">
                      {/* Image - Clickable to edit with overlay button */}
                      <button 
                        onClick={() => handleEditItem(item, index)}
                        className="relative shrink-0 group"
                      >
                        {item.product.image ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                            <span className="text-3xl">🍽️</span>
                          </div>
                        )}
                        {/* Edit overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 rounded-b-lg py-0.5">
                          <span className="text-white text-xs font-semibold">Editar</span>
                        </div>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          {/* Name/Description - Clickable to edit */}
                          <button 
                            onClick={() => handleEditItem(item, index)}
                            className="flex-1 min-w-0 text-left"
                          >
                            <h4 className="font-semibold text-sm text-foreground line-clamp-2">
                              {item.quantity}x {item.product.name}
                            </h4>
                            {item.product.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {item.product.description}
                              </p>
                            )}
                          </button>
                          {/* Quantity Controls - Right aligned */}
                          <div className="flex items-center gap-0 bg-muted rounded-lg overflow-hidden shrink-0">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-[hsl(221,83%,53%)] hover:bg-muted/80 transition-colors"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </button>
                            <span className="w-8 text-center font-semibold text-sm text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-[hsl(221,83%,53%)] hover:bg-muted/80 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Price - Clickable to edit */}
                        <button 
                          onClick={() => handleEditItem(item, index)}
                          className="text-left"
                        >
                          <p className="text-sm font-bold text-foreground mt-1">
                            {formatCurrency(itemPrice)}
                          </p>
                        </button>

                        {/* Extras with quantity badges */}
                        {item.extras && item.extras.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.extras.map((extra, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                                <span className="inline-flex items-center justify-center bg-muted text-muted-foreground rounded px-2 py-0.5 text-xs font-medium min-w-[24px]">
                                  {extra.quantity || 1}
                                </span>
                                <span>{extra.optionName}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add more items */}
            <div className="px-4 py-4 border-t border-border">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full text-center text-[hsl(221,83%,53%)] font-semibold text-sm"
              >
                Adicionar mais itens
              </button>
            </div>

            {/* Coupon Section */}
            <div className="px-4 py-4 border-t border-border">
              {appliedCoupon && appliedCoupon.valid ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <TicketPercent className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        {appliedCoupon.discount_type === 'percent'
                          ? `${appliedCoupon.discount_value}% de desconto`
                          : `${formatCurrency(appliedCoupon.discount_value || 0)} de desconto`}
                      </p>
                      <p className="text-xs text-green-600">Cupom {appliedCouponCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCouponSheet(true)}
                      className="text-sm text-[hsl(221,83%,53%)] font-semibold hover:text-[hsl(221,83%,48%)] transition-colors"
                    >
                      Trocar
                    </button>
                    <button
                      onClick={handleRemoveCoupon}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCouponSheet(true)}
                  className="flex items-center justify-between w-full"
                >
                  <div className="flex items-center gap-3">
                    <TicketPercent className="w-5 h-5 text-foreground" />
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground">Cupom</p>
                      <p className="text-xs text-muted-foreground">Digite um código</p>
                    </div>
                  </div>
                  <span className="text-[hsl(221,83%,53%)] font-semibold text-sm">Digitar</span>
                </button>
              )}
            </div>

            {/* Available Coupons Banner */}
            {hasCoupons && (
              <div className="mx-4 my-3 px-4 py-3 bg-muted/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">
                      <span className="text-foreground font-bold">{availableCoupons.length} {availableCoupons.length === 1 ? 'cupom' : 'cupons'}</span> de {getBannerText()} aqui
                    </span>
                  </div>
                  <button 
                    onClick={() => setShowCouponSheet(true)}
                    className="text-[hsl(221,83%,53%)] font-semibold text-sm"
                  >
                    Pegar
                  </button>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="px-4 py-4">
              <h3 className="font-bold text-foreground mb-4">Resumo de valores</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatCurrency(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span className="text-muted-foreground">A calcular</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Bottom padding for footer */}
            <div className="h-32" />
          </div>

          {/* Footer - Fixed */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total com a entrega</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(finalTotal)}</p>
                  <p className="text-sm text-muted-foreground">/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  // Navigate immediately without waiting for sheet close animation
                  navigate(`/r/${slug}/checkout`);
                  // Close sheet after navigation starts (will unmount anyway)
                  setTimeout(() => setIsOpen(false), 0);
                }}
                className="bg-[hsl(221,83%,53%)] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[hsl(221,83%,48%)] active:scale-[0.98] transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Coupon Sheet */}
      {restaurant?.id && (
        <CouponSheet
          open={showCouponSheet}
          onOpenChange={setShowCouponSheet}
          restaurantId={restaurant.id}
          orderTotal={totalPrice}
          availableCoupons={availableCoupons}
          appliedCoupon={appliedCoupon}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      )}

      {/* Cart Item Edit Sheet */}
      <CartItemEditSheet
        cartItem={editingItem}
        cartItemIndex={editingItemIndex}
        extraGroups={extraGroups}
        isOpen={!!editingItem}
        onClose={handleCloseEditSheet}
        onSave={handleSaveEditedItem}
        onRemove={handleRemoveEditedItem}
      />

      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total sem a entrega</p>
              <p className="text-base font-bold text-foreground">
                {formatCurrency(finalTotal)} <span className="text-sm font-normal text-muted-foreground">/ {totalItems} {totalItems === 1 ? 'item' : 'itens'}</span>
              </p>
            </div>
            <button
              onClick={handleOpenCart}
              className="bg-[hsl(221,83%,53%)] text-white font-semibold px-14 py-2 rounded-lg hover:bg-[hsl(221,83%,48%)] active:scale-[0.98] transition-all"
            >
              Ver sacola
            </button>
          </div>
        </div>
      )}

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
    </>
  );
};

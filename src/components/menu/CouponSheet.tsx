import { useState } from 'react';
import { X, Tag, Check, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrency } from '@/lib/format';
import { PublicCoupon } from '@/hooks/usePublicCoupons';
import { useValidateCoupon, ValidateCouponResult } from '@/hooks/useCoupons';
import { toast } from '@/components/ui/app-toast';

interface CouponSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  orderTotal: number;
  availableCoupons: PublicCoupon[];
  appliedCoupon: ValidateCouponResult | null;
  onApplyCoupon: (result: ValidateCouponResult, code: string) => void;
  onRemoveCoupon: () => void;
}

export const CouponSheet = ({
  open,
  onOpenChange,
  restaurantId,
  orderTotal,
  availableCoupons,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}: CouponSheetProps) => {
  const [couponCode, setCouponCode] = useState('');
  const validateCoupon = useValidateCoupon();

  const handleApplyCoupon = async (code: string) => {
    if (!code.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    try {
      const result = await validateCoupon.mutateAsync({
        restaurantId,
        code: code.trim().toUpperCase(),
        orderTotal,
      });

      if (result.valid) {
        onApplyCoupon(result, code.trim().toUpperCase());
        setCouponCode('');
        onOpenChange(false);
        toast.success('Cupom aplicado com sucesso!');
      } else {
        toast.error(result.error_message || 'Cupom inválido');
      }
    } catch {
      toast.error('Erro ao validar cupom');
    }
  };

  const formatCouponDiscount = (coupon: PublicCoupon) => {
    if (coupon.discount_type === 'percent') {
      return `${coupon.discount_value}% OFF`;
    }
    return `${formatCurrency(coupon.discount_value)} OFF`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0" hideCloseButton>
        <SheetHeader className="px-4 py-4 border-b border-border flex flex-row items-center justify-between">
          <SheetTitle className="text-base font-bold">Cupons</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </SheetHeader>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Input Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Digite o código do cupom
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO DO CUPOM"
                className="flex-1 px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20 focus:border-[hsl(221,83%,53%)] uppercase"
              />
              <button
                onClick={() => handleApplyCoupon(couponCode)}
                disabled={validateCoupon.isPending || !couponCode.trim()}
                className="px-6 py-3 bg-[hsl(221,83%,53%)] text-white font-semibold rounded-lg hover:bg-[hsl(221,83%,48%)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {validateCoupon.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </button>
            </div>
          </div>

          {/* Applied Coupon */}
          {appliedCoupon && appliedCoupon.valid && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Cupom aplicado</p>
                    <p className="text-sm text-green-600">
                      {appliedCoupon.discount_type === 'percent'
                        ? `${appliedCoupon.discount_value}% de desconto`
                        : `${formatCurrency(appliedCoupon.discount_value || 0)} de desconto`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="text-sm text-red-500 font-semibold hover:text-red-600 transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          {/* Available Coupons */}
          {availableCoupons.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Cupons disponíveis</h3>
              <div className="space-y-2">
                {availableCoupons.map((coupon) => {
                  const isApplied = appliedCoupon?.coupon_id === coupon.id;
                  const meetsMinOrder = orderTotal >= coupon.min_order_value;
                  
                  return (
                    <button
                      key={coupon.id}
                      onClick={() => handleApplyCoupon(coupon.code)}
                      disabled={validateCoupon.isPending || isApplied || !meetsMinOrder}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        isApplied
                          ? 'border-green-500 bg-green-50'
                          : meetsMinOrder
                          ? 'border-border bg-muted/30 hover:border-[hsl(221,83%,53%)] hover:bg-muted/50'
                          : 'border-border bg-muted/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Tag className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{coupon.code}</p>
                            <p className="text-sm text-muted-foreground">
                              {coupon.min_order_value > 0
                                ? `Pedido mínimo ${formatCurrency(coupon.min_order_value)}`
                                : 'Sem pedido mínimo'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[hsl(221,83%,53%)]">
                            {formatCouponDiscount(coupon)}
                          </p>
                          {isApplied && (
                            <p className="text-xs text-green-600 font-medium">Aplicado</p>
                          )}
                          {!meetsMinOrder && !isApplied && (
                            <p className="text-xs text-muted-foreground">
                              Faltam {formatCurrency(coupon.min_order_value - orderTotal)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {availableCoupons.length === 0 && !appliedCoupon && (
            <div className="text-center py-8">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum cupom disponível no momento
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

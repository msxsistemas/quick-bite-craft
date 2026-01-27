import { useState } from 'react';
import { X, Tag, Check, Loader2, Ticket, Keyboard } from 'lucide-react';
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

type TabType = 'grab' | 'type';

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
  const [activeTab, setActiveTab] = useState<TabType>(availableCoupons.length > 0 ? 'grab' : 'type');
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
      <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85vh]" hideCloseButton>
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">Cupons de desconto</SheetTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('grab')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'grab'
                  ? 'bg-[hsl(221,83%,53%)] text-white shadow-lg shadow-[hsl(221,83%,53%)]/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Ticket className="w-4 h-4" />
              Pegar cupom
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'type'
                  ? 'bg-[hsl(221,83%,53%)] text-white shadow-lg shadow-[hsl(221,83%,53%)]/25'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Digitar código
            </button>
          </div>
        </SheetHeader>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Applied Coupon - Always visible */}
          {appliedCoupon && appliedCoupon.valid && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl animate-scale-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-800 dark:text-emerald-200">Cupom aplicado!</p>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                      {appliedCoupon.discount_type === 'percent'
                        ? `${appliedCoupon.discount_value}% de desconto`
                        : `${formatCurrency(appliedCoupon.discount_value || 0)} de desconto`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="px-3 py-1.5 text-sm text-red-500 font-semibold bg-red-50 dark:bg-red-950/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          {/* Type Code Tab */}
          {activeTab === 'type' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">
                  Digite o código do cupom
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: BEMVINDO"
                    className="w-full px-4 py-4 pr-24 border-2 border-border rounded-xl bg-background text-foreground text-lg font-semibold tracking-wider placeholder:text-muted-foreground placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:border-[hsl(221,83%,53%)] focus:ring-4 focus:ring-[hsl(221,83%,53%)]/10 uppercase transition-all"
                  />
                  <button
                    onClick={() => handleApplyCoupon(couponCode)}
                    disabled={validateCoupon.isPending || !couponCode.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[hsl(221,83%,53%)] text-white font-semibold rounded-lg hover:bg-[hsl(221,83%,48%)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {validateCoupon.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center py-4">
                Insira um código promocional para ganhar desconto no seu pedido
              </p>
            </div>
          )}

          {/* Grab Coupon Tab */}
          {activeTab === 'grab' && (
            <div className="space-y-3 animate-fade-in">
              {availableCoupons.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Selecione um cupom para aplicar automaticamente
                  </p>
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => {
                      const isApplied = appliedCoupon?.coupon_id === coupon.id;
                      const meetsMinOrder = orderTotal >= coupon.min_order_value;
                      
                      return (
                        <button
                          key={coupon.id}
                          onClick={() => handleApplyCoupon(coupon.code)}
                          disabled={validateCoupon.isPending || isApplied || !meetsMinOrder}
                          className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                            isApplied
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                              : meetsMinOrder
                              ? 'border-border bg-background hover:border-[hsl(221,83%,53%)] hover:shadow-lg hover:shadow-[hsl(221,83%,53%)]/10 hover:-translate-y-0.5'
                              : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              isApplied 
                                ? 'bg-emerald-100 dark:bg-emerald-900' 
                                : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            }`}>
                              {isApplied ? (
                                <Check className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Tag className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-foreground text-lg">{coupon.code}</p>
                                {isApplied && (
                                  <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full">
                                    Ativo
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {coupon.min_order_value > 0
                                  ? `Pedido mínimo ${formatCurrency(coupon.min_order_value)}`
                                  : 'Sem pedido mínimo'}
                              </p>
                              {!meetsMinOrder && !isApplied && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                                  Faltam {formatCurrency(coupon.min_order_value - orderTotal)} para usar
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-xl ${
                                isApplied ? 'text-emerald-600 dark:text-emerald-400' : 'text-[hsl(221,83%,53%)]'
                              }`}>
                                {formatCouponDiscount(coupon)}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Ticket className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Nenhum cupom disponível
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tente digitar um código promocional
                  </p>
                  <button
                    onClick={() => setActiveTab('type')}
                    className="mt-4 px-6 py-2 bg-[hsl(221,83%,53%)] text-white font-semibold rounded-xl hover:bg-[hsl(221,83%,48%)] transition-colors"
                  >
                    Digitar código
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface CheckoutFooterProps {
  step: 'details' | 'payment' | 'review';
  total: number;
  itemCount: number;
  isDelivery: boolean;
  isStoreOpen: boolean;
  isSubmitting: boolean;
  onContinue: () => void;
  onReview: () => void;
  onSubmit: () => void;
}

export const CheckoutFooter: React.FC<CheckoutFooterProps> = ({
  step,
  total,
  itemCount,
  isDelivery,
  isStoreOpen,
  isSubmitting,
  onContinue,
  onReview,
  onSubmit,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
      <div className="max-w-lg mx-auto">
        {step === 'details' ? (
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {isDelivery ? 'Total com a entrega' : 'Total do pedido'}
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                <p className="text-sm text-muted-foreground">
                  / {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>
            <button 
              onClick={onContinue}
              disabled={!isStoreOpen}
              className="bg-primary text-primary-foreground font-semibold px-8 py-3.5 rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!isStoreOpen ? 'Loja Fechada' : 'Continuar'}
            </button>
          </div>
        ) : step === 'payment' ? (
          <div className="px-4 py-3">
            <button 
              onClick={onReview}
              disabled={!isStoreOpen}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {!isStoreOpen ? (
                'Loja Fechada'
              ) : (
                <>
                  <span>Revisar pedido</span>
                  <span className="font-bold">• {formatCurrency(total)}</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="px-4 py-3">
            <button 
              onClick={onSubmit}
              disabled={!isStoreOpen || isSubmitting}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : !isStoreOpen ? (
                'Loja Fechada'
              ) : (
                <>
                  <span>Enviar pedido</span>
                  <span className="font-bold">• {formatCurrency(total)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

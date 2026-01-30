import { Banknote, CreditCard, ChevronRight } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/format';
import pixLogo from '@/assets/pix-logo.png';

type PaymentMethod = 'cash' | 'pix' | 'card' | '';
type PaymentTab = 'online' | 'delivery';

interface PaymentMethodSelectorProps {
  paymentTab: PaymentTab;
  paymentMethod: PaymentMethod;
  changeFor: number;
  noChangeNeeded: boolean;
  total: number;
  onTabChange: (tab: PaymentTab) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onChangeForChange: (value: number) => void;
  onNoChangeNeededChange: (value: boolean) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentTab,
  paymentMethod,
  changeFor,
  noChangeNeeded,
  total,
  onTabChange,
  onMethodChange,
  onChangeForChange,
  onNoChangeNeededChange,
}) => {
  // Get the selected payment method label
  const getPaymentLabel = () => {
    switch (paymentMethod) {
      case 'pix':
        return 'Pix';
      case 'cash':
        return 'Dinheiro';
      case 'card':
        return 'Cartão';
      default:
        return 'Selecione';
    }
  };

  // Get the icon for the selected payment method
  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'pix':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
          </div>
        );
      case 'cash':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Banknote className="w-4 h-4 text-white" />
          </div>
        );
      case 'card':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-400" />
          </div>
        );
    }
  };

  return (
    <div className="px-4">
      <h3 className="font-bold text-gray-900 mb-4">Pagamento pelo app</h3>
      
      {/* Payment selection button - styled like the reference */}
      <button
        onClick={() => {
          // Toggle between payment methods
          if (paymentMethod === 'pix') {
            onMethodChange('cash');
            onTabChange('delivery');
          } else if (paymentMethod === 'cash') {
            onMethodChange('card');
          } else if (paymentMethod === 'card') {
            onMethodChange('pix');
            onTabChange('online');
          } else {
            onMethodChange('pix');
            onTabChange('online');
          }
        }}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {getPaymentIcon()}
          <span className="font-medium text-gray-900">{getPaymentLabel()}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Change for cash */}
      {paymentMethod === 'cash' && (
        <div className="mt-4">
          <p className="text-gray-700 font-medium mb-3">Precisa de troco?</p>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200">
              <span className="text-gray-500 text-sm whitespace-nowrap">Troco para:</span>
              <CurrencyInput
                value={changeFor}
                onChange={(val) => {
                  onChangeForChange(val);
                  if (val > 0) onNoChangeNeededChange(false);
                }}
                className="w-full bg-transparent border-0 p-0 h-auto text-base text-gray-900 font-semibold focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:font-normal"
                placeholder="Valor"
              />
            </div>

            <button
              onClick={() => {
                if (noChangeNeeded) {
                  onNoChangeNeededChange(false);
                } else {
                  onNoChangeNeededChange(true);
                  onChangeForChange(0);
                }
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                noChangeNeeded ? 'border-gray-900 bg-gray-900' : 'border-gray-400'
              }`}>
                {noChangeNeeded && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <span className="whitespace-nowrap text-xs">Não preciso de troco</span>
            </button>
          </div>

          {!noChangeNeeded && changeFor > 0 && changeFor < total && (
            <p className="text-sm text-red-600 mt-2">⚠️ O valor deve ser maior que {formatCurrency(total)}</p>
          )}
        </div>
      )}
    </div>
  );
};

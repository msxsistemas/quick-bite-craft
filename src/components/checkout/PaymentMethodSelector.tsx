import { Banknote, CreditCard } from 'lucide-react';
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
  return (
    <div>
      {/* Payment Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            onTabChange('online');
            onMethodChange('pix');
          }}
          className={`flex-1 py-4 text-center font-medium transition-colors relative ${
            paymentTab === 'online' ? 'text-primary' : 'text-gray-500'
          }`}
        >
          Pagar pelo app
          {paymentTab === 'online' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => {
            onTabChange('delivery');
            onMethodChange('cash');
          }}
          className={`flex-1 py-4 text-center font-medium transition-colors relative ${
            paymentTab === 'delivery' ? 'text-primary' : 'text-gray-500'
          }`}
        >
          Pagar na entrega
          {paymentTab === 'delivery' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      <div className="px-4 py-6 space-y-3">
        {paymentTab === 'online' ? (
          <button
            onClick={() => onMethodChange(paymentMethod === 'pix' ? '' : 'pix')}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
              paymentMethod === 'pix' ? 'border-gray-900' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900">Pix</span>
                <p className="text-sm text-gray-500">Aprovação automática</p>
              </div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              paymentMethod === 'pix' ? 'border-gray-900' : 'border-gray-300'
            }`}>
              {paymentMethod === 'pix' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
            </div>
          </button>
        ) : (
          <>
            <button
              onClick={() => onMethodChange(paymentMethod === 'cash' ? '' : 'cash')}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
                paymentMethod === 'cash' ? 'border-gray-900' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Banknote className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-gray-900">Dinheiro</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'cash' ? 'border-gray-900' : 'border-gray-300'
              }`}>
                {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
              </div>
            </button>

            <button
              onClick={() => onMethodChange(paymentMethod === 'card' ? '' : 'card')}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
                paymentMethod === 'card' ? 'border-gray-900' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">Cartão</span>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                paymentMethod === 'card' ? 'border-gray-900' : 'border-gray-300'
              }`}>
                {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
              </div>
            </button>
          </>
        )}
      </div>

      {/* Change for cash */}
      {paymentMethod === 'cash' && (
        <div className="mx-4 mb-6">
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

import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/format';

interface CashChangeInputProps {
  changeFor: number;
  onChangeForUpdate: (value: number) => void;
  noChangeNeeded: boolean;
  onNoChangeNeededToggle: () => void;
  total: number;
}

export const CashChangeInput = ({
  changeFor,
  onChangeForUpdate,
  noChangeNeeded,
  onNoChangeNeededToggle,
  total,
}: CashChangeInputProps) => {
  return (
    <div>
      <p className="text-gray-700 font-medium mb-3">Precisa de troco?</p>
      
      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-3">
        {/* Troco para card - left half */}
        <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200">
          <span className="text-gray-500 text-sm whitespace-nowrap">Troco para:</span>
          <CurrencyInput
            value={changeFor}
            onChange={(val) => {
              onChangeForUpdate(val);
            }}
            className="w-full bg-transparent border-0 p-0 h-auto text-base text-gray-900 font-semibold focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400 placeholder:font-normal"
            placeholder="Valor"
          />
        </div>

        {/* Não preciso de troco - right half */}
        <button
          onClick={onNoChangeNeededToggle}
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

      {/* Validation messages */}
      {!noChangeNeeded && changeFor > 0 && changeFor < total && (
        <p className="text-sm text-red-600 mt-2">⚠️ O valor deve ser maior que {formatCurrency(total)}</p>
      )}
    </div>
  );
};

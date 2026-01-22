import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/format';

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'pix' | 'dinheiro' | 'cartao';
  defaultAmount: number;
  serviceFeePercentage: number;
  totalServiceFee: number;
  onConfirm: (amount: number, includeServiceFee: boolean, serviceFeeType: 'proportional' | 'integral') => void;
}

const methodLabels: Record<string, string> = {
  pix: 'Pagar com Pix',
  dinheiro: 'Pagar com Dinheiro',
  cartao: 'Pagar com Cartão',
};

export const PaymentSheet = ({
  open,
  onOpenChange,
  method,
  defaultAmount,
  serviceFeePercentage,
  totalServiceFee,
  onConfirm,
}: PaymentSheetProps) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [serviceFeeType, setServiceFeeType] = useState<'proportional' | 'integral'>('proportional');

  const proportionalFee = (amount * serviceFeePercentage) / 100;
  const integralFee = totalServiceFee;
  const selectedFee = includeServiceFee ? (serviceFeeType === 'proportional' ? proportionalFee : integralFee) : 0;
  const totalWithFee = amount + selectedFee;

  const handleConfirm = () => {
    onConfirm(amount, includeServiceFee, serviceFeeType);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
        <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <SheetTitle className="text-black font-semibold">{methodLabels[method]}</SheetTitle>
          <button onClick={() => onOpenChange(false)} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Valor a pagar */}
          <div>
            <Label className="text-gray-600 text-sm">Valor a pagar:</Label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              className="mt-1 bg-gray-100 border-0 text-black"
              showPrefix
            />
          </div>

          {/* Taxa de serviço */}
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Taxa de serviço</span>
            <Switch
              checked={includeServiceFee}
              onCheckedChange={setIncludeServiceFee}
            />
          </div>

          {includeServiceFee && (
            <RadioGroup
              value={serviceFeeType}
              onValueChange={(v) => setServiceFeeType(v as 'proportional' | 'integral')}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="proportional" id="proportional" />
                  <Label htmlFor="proportional" className="text-gray-700">
                    Proporcional ({serviceFeePercentage}%)
                  </Label>
                </div>
                <span className="text-gray-600">{formatCurrency(proportionalFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="integral" id="integral" />
                  <Label htmlFor="integral" className="text-gray-700">Integral</Label>
                </div>
                <span className="text-gray-600">{formatCurrency(integralFee)}</span>
              </div>
            </RadioGroup>
          )}

          {/* Valor total */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-gray-700 font-medium">Valor total:</span>
            <span className="text-black font-bold">{formatCurrency(totalWithFee)}</span>
          </div>

          {/* Cliente */}
          <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
            <span className="text-gray-700">
              Cliente <span className="text-gray-400">(opcional)</span>
            </span>
            <button className="text-cyan-500 font-medium">Adicionar</button>
          </div>

          {/* Pagar button */}
          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
          >
            Pagar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

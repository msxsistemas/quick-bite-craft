import { useState, useEffect } from 'react';
import { X, Diamond, DollarSign, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';

export interface PaymentData {
  id: string;
  method: 'pix' | 'dinheiro' | 'cartao';
  amount: number;
  serviceFee: number;
  status: 'pending' | 'completed' | 'expired';
  customers?: CustomerInfo[];
}

export interface CustomerInfo {
  phone: string;
  name: string;
  identified: boolean;
}

interface EditPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentData | null;
  serviceFeePercentage: number;
  totalServiceFee: number;
  onSave: (payment: PaymentData) => void;
}

const methodOptions = [
  { value: 'pix', label: 'Pix', icon: Diamond, color: 'bg-green-500' },
  { value: 'dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'bg-cyan-500' },
  { value: 'cartao', label: 'Cartão', icon: CreditCard, color: 'bg-cyan-500' },
] as const;

export const EditPaymentSheet = ({
  open,
  onOpenChange,
  payment,
  serviceFeePercentage,
  totalServiceFee,
  onSave,
}: EditPaymentSheetProps) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('cartao');
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [serviceFeeType, setServiceFeeType] = useState<'proportional' | 'integral'>('proportional');

  useEffect(() => {
    if (open && payment) {
      setAmount(payment.amount);
      setMethod(payment.method);
      setIncludeServiceFee(payment.serviceFee > 0);
      // Determine if it was proportional or integral based on the fee value
      const proportionalFee = (payment.amount * serviceFeePercentage) / 100;
      setServiceFeeType(Math.abs(payment.serviceFee - proportionalFee) < 0.01 ? 'proportional' : 'integral');
    }
  }, [open, payment, serviceFeePercentage]);

  const proportionalFee = (amount * serviceFeePercentage) / 100;
  const integralFee = totalServiceFee;
  const selectedFee = includeServiceFee ? (serviceFeeType === 'proportional' ? proportionalFee : integralFee) : 0;

  const handleSave = () => {
    if (!payment) return;
    
    onSave({
      ...payment,
      method,
      amount,
      serviceFee: selectedFee,
      status: method === 'pix' ? 'pending' : 'completed',
    });
    onOpenChange(false);
  };

  if (!payment) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
        <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <SheetTitle className="text-black font-semibold">Editar pagamento</SheetTitle>
          <button onClick={() => onOpenChange(false)} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Payment Method Selection */}
          <div>
            <Label className="text-gray-600 text-sm mb-2 block">Método de pagamento:</Label>
            <div className="flex gap-2">
              {methodOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = method === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMethod(opt.value)}
                    className={`flex-1 py-3 rounded-xl font-bold flex flex-col items-center gap-0.5 transition-colors ${
                      isSelected 
                        ? opt.value === 'pix' ? 'bg-green-500 text-white' : 'bg-cyan-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label className="text-gray-600 text-sm">Valor a pagar:</Label>
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              className="mt-1 bg-gray-100 border-0 text-black"
              showPrefix
            />
          </div>

          {/* Service Fee Toggle */}
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
                  <RadioGroupItem value="proportional" id="edit-proportional" className="border-orange-500 text-orange-500" />
                  <Label htmlFor="edit-proportional" className="text-gray-700">
                    Proporcional ({serviceFeePercentage}%)
                  </Label>
                </div>
                <span className="text-gray-600">{formatCurrency(proportionalFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="integral" id="edit-integral" className="border-orange-500 text-orange-500" />
                  <Label htmlFor="edit-integral" className="text-gray-700">Integral</Label>
                </div>
                <span className="text-gray-600">{formatCurrency(integralFee)}</span>
              </div>
            </RadioGroup>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-gray-700 font-medium">Valor total:</span>
            <span className="text-black font-bold">{formatCurrency(amount + selectedFee)}</span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

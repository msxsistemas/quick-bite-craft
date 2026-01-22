import { useState, useEffect } from 'react';
import { X, ChevronLeft, Minus, Plus, Phone, User } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';

interface CustomerInfo {
  phone: string;
  name: string;
  identified: boolean;
}

interface PaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: 'pix' | 'dinheiro' | 'cartao';
  defaultAmount: number;
  serviceFeePercentage: number;
  totalServiceFee: number;
  restaurantId: string;
  onConfirm: (amount: number, includeServiceFee: boolean, serviceFeeType: 'proportional' | 'integral', customers?: CustomerInfo[]) => void;
}

const methodLabels: Record<string, string> = {
  pix: 'Pagar com Pix',
  dinheiro: 'Pagar com Dinheiro',
  cartao: 'Pagar com Cartão',
};

type ViewStep = 'payment' | 'identify' | 'new-customer';

export const PaymentSheet = ({
  open,
  onOpenChange,
  method,
  defaultAmount,
  serviceFeePercentage,
  totalServiceFee,
  restaurantId,
  onConfirm,
}: PaymentSheetProps) => {
  const [amount, setAmount] = useState(defaultAmount);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [serviceFeeType, setServiceFeeType] = useState<'proportional' | 'integral'>('proportional');
  const [viewStep, setViewStep] = useState<ViewStep>('payment');
  const [customerCount, setCustomerCount] = useState(1);
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setAmount(defaultAmount);
      setViewStep('payment');
      setCustomerCount(1);
      setCustomers([]);
      setNewCustomerPhone('');
      setNewCustomerName('');
    }
  }, [open, defaultAmount]);

  const proportionalFee = (amount * serviceFeePercentage) / 100;
  const integralFee = totalServiceFee;
  const selectedFee = includeServiceFee ? (serviceFeeType === 'proportional' ? proportionalFee : integralFee) : 0;
  const totalWithFee = amount + selectedFee;

  const handleConfirm = async () => {
    // Save identified customers to customer_loyalty
    for (const customer of customers) {
      if (customer.identified && customer.phone) {
        try {
          // Check if customer already exists
          const { data: existing } = await supabase
            .from('customer_loyalty')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('customer_phone', customer.phone)
            .maybeSingle();

          if (!existing) {
            // Create new customer loyalty record
            await supabase.from('customer_loyalty').insert({
              restaurant_id: restaurantId,
              customer_phone: customer.phone,
              customer_name: customer.name || null,
              total_points: 0,
              lifetime_points: 0,
            });
          } else if (customer.name) {
            // Update name if provided
            await supabase
              .from('customer_loyalty')
              .update({ customer_name: customer.name })
              .eq('id', existing.id);
          }
        } catch (error) {
          console.error('Error saving customer:', error);
        }
      }
    }

    onConfirm(amount, includeServiceFee, serviceFeeType, customers.length > 0 ? customers : undefined);
    onOpenChange(false);
  };

  const handleAddCustomer = () => {
    setViewStep('identify');
  };

  const handleBackToPayment = () => {
    setViewStep('payment');
  };

  const handleBackToIdentify = () => {
    setViewStep('identify');
    setNewCustomerPhone('');
    setNewCustomerName('');
  };

  const handleNotIdentified = (index: number) => {
    const newCustomers = [...customers];
    newCustomers[index] = { phone: '', name: '', identified: false };
    setCustomers(newCustomers);
  };

  const handleNewCustomer = () => {
    setViewStep('new-customer');
  };

  const handleSaveNewCustomer = () => {
    if (newCustomerPhone || newCustomerName) {
      const newCustomers = [...customers, { phone: newCustomerPhone, name: newCustomerName, identified: true }];
      setCustomers(newCustomers);
    }
    setNewCustomerPhone('');
    setNewCustomerName('');
    setViewStep('identify');
  };

  const handleIncreaseCustomerCount = () => {
    setCustomerCount(prev => prev + 1);
  };

  const handleDecreaseCustomerCount = () => {
    if (customerCount > 1) {
      setCustomerCount(prev => prev - 1);
      if (customers.length > customerCount - 1) {
        setCustomers(customers.slice(0, customerCount - 1));
      }
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Initialize customers array based on count
  const customerSlots = Array.from({ length: customerCount }, (_, i) => customers[i] || null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
        {/* Payment View */}
        {viewStep === 'payment' && (
          <>
            <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <SheetTitle className="text-black font-semibold">{methodLabels[method]}</SheetTitle>
              <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-4">
              <div>
                <Label className="text-gray-600 text-sm">Valor a pagar:</Label>
                <CurrencyInput
                  value={amount}
                  onChange={setAmount}
                  className="mt-1 bg-gray-100 border-0 text-black"
                  showPrefix
                />
              </div>

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
                      <RadioGroupItem value="proportional" id="proportional" className="border-orange-500 text-orange-500" />
                      <Label htmlFor="proportional" className="text-gray-700">
                        Proporcional ({serviceFeePercentage}%)
                      </Label>
                    </div>
                    <span className="text-gray-600">{formatCurrency(proportionalFee)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="integral" id="integral" className="border-orange-500 text-orange-500" />
                      <Label htmlFor="integral" className="text-gray-700">Integral</Label>
                    </div>
                    <span className="text-gray-600">{formatCurrency(integralFee)}</span>
                  </div>
                </RadioGroup>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-gray-700 font-medium">Valor total:</span>
                <span className="text-black font-bold">{formatCurrency(totalWithFee)}</span>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-between">
                <span className="text-gray-700">
                  Cliente <span className="text-gray-400">(opcional)</span>
                </span>
                <button onClick={handleAddCustomer} className="text-cyan-500 font-medium">Adicionar</button>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
              >
                Pagar
              </button>
            </div>
          </>
        )}

        {/* Identify Customers View */}
        {viewStep === 'identify' && (
          <>
            <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <SheetTitle className="text-black font-semibold">{methodLabels[method]}</SheetTitle>
              <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </SheetHeader>

            <div className="px-4 pb-2">
              <Label className="text-gray-600 text-sm">Valor a pagar:</Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                className="mt-1 bg-gray-100 border-0 text-black"
                showPrefix
              />
            </div>

            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-gray-700">Taxa de serviço</span>
              <Switch
                checked={includeServiceFee}
                onCheckedChange={setIncludeServiceFee}
              />
            </div>

            {/* Identify Customer Overlay */}
            <div className="bg-gray-200 rounded-t-2xl mt-2">
              <div className="p-4 flex items-center justify-between">
                <span className="text-black font-semibold">Identifique o cliente que pagou</span>
                <button onClick={handleBackToPayment} className="p-1 text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-4 pb-4 space-y-3">
                {/* Customer slots */}
                <div className={`grid gap-2 ${customerCount > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {customerSlots.map((customer, index) => (
                    <button
                      key={index}
                      onClick={() => handleNotIdentified(index)}
                      className={`py-3 rounded-lg text-white font-medium transition-colors ${
                        customer ? 'bg-gray-500' : 'bg-cyan-500 hover:bg-cyan-400'
                      }`}
                    >
                      {customer?.name || 'Não identificado'}
                    </button>
                  ))}
                </div>

                {/* Counter */}
                <div className="flex items-center justify-center gap-4 py-2">
                  <button
                    onClick={handleDecreaseCustomerCount}
                    className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="text-black font-bold text-lg min-w-[24px] text-center">{customerCount}</span>
                  <button
                    onClick={handleIncreaseCustomerCount}
                    className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* New Customer Button */}
                <button
                  onClick={handleNewCustomer}
                  className="w-full py-4 border-2 border-cyan-500 rounded-xl text-cyan-500 font-bold hover:bg-cyan-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Novo cliente
                </button>
              </div>
            </div>
          </>
        )}

        {/* New Customer Form View */}
        {viewStep === 'new-customer' && (
          <>
            <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <SheetTitle className="text-black font-semibold">{methodLabels[method]}</SheetTitle>
              <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </SheetHeader>

            <div className="px-4 pb-2">
              <Label className="text-gray-600 text-sm">Valor a pagar:</Label>
            </div>

            {/* Identify Customer Overlay with Form */}
            <div className="bg-gray-200 rounded-t-2xl mt-2">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={handleBackToIdentify} className="p-1 text-gray-600 hover:text-gray-800">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-black font-semibold">Identifique o cliente que pagou</span>
                </div>
                <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-4 pb-6 space-y-4">
                {/* Not Identified Button */}
                <button
                  onClick={() => {
                    setCustomers([...customers, { phone: '', name: '', identified: false }]);
                    setViewStep('identify');
                  }}
                  className="w-full py-4 bg-cyan-500 rounded-lg text-white font-medium hover:bg-cyan-400 transition-colors"
                >
                  Não identificado
                </button>

                {/* New Customer Form */}
                <div className="space-y-3">
                  <Label className="text-gray-700 font-medium">Novo cliente:</Label>
                  
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="Número do WhatsApp"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                      className="pl-10 bg-white border border-gray-300 text-black placeholder:text-gray-400"
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Nome e Sobrenome"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      className="pl-10 bg-white border border-gray-300 text-black placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveNewCustomer}
                  className="w-full py-4 bg-gray-400 rounded-xl text-white font-bold hover:bg-gray-500 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

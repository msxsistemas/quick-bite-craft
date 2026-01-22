import { useState, useEffect } from 'react';
import { X, Phone, User, Plus, Minus, ChevronLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';

export interface CustomerInfo {
  phone: string;
  name: string;
  identified: boolean;
}

interface SwapCustomerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCustomers: CustomerInfo[];
  restaurantId: string;
  onSave: (customers: CustomerInfo[]) => void;
}

type ViewStep = 'list' | 'new-customer';

export const SwapCustomerSheet = ({
  open,
  onOpenChange,
  currentCustomers,
  restaurantId,
  onSave,
}: SwapCustomerSheetProps) => {
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [customerCount, setCustomerCount] = useState(1);
  const [viewStep, setViewStep] = useState<ViewStep>('list');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');

  useEffect(() => {
    if (open) {
      setCustomers(currentCustomers.length > 0 ? [...currentCustomers] : []);
      setCustomerCount(Math.max(1, currentCustomers.length));
      setViewStep('list');
      setNewCustomerPhone('');
      setNewCustomerName('');
    }
  }, [open, currentCustomers]);

  const handleMarkNotIdentified = () => {
    if (customers.length < customerCount) {
      setCustomers([...customers, { phone: '', name: '', identified: false }]);
    }
  };

  const handleNewCustomer = () => {
    setViewStep('new-customer');
  };

  const handleBackToList = () => {
    setViewStep('list');
    setNewCustomerPhone('');
    setNewCustomerName('');
  };

  const handleSaveNewCustomer = async () => {
    if (newCustomerPhone || newCustomerName) {
      const newCustomer: CustomerInfo = { 
        phone: newCustomerPhone, 
        name: newCustomerName, 
        identified: true 
      };
      
      // Save to customer_loyalty if phone provided
      if (newCustomerPhone && restaurantId) {
        try {
          const { data: existing } = await supabase
            .from('customer_loyalty')
            .select('id')
            .eq('restaurant_id', restaurantId)
            .eq('customer_phone', newCustomerPhone)
            .maybeSingle();

          if (!existing) {
            await supabase.from('customer_loyalty').insert({
              restaurant_id: restaurantId,
              customer_phone: newCustomerPhone,
              customer_name: newCustomerName || null,
              total_points: 0,
              lifetime_points: 0,
            });
          } else if (newCustomerName) {
            await supabase
              .from('customer_loyalty')
              .update({ customer_name: newCustomerName })
              .eq('id', existing.id);
          }
        } catch (error) {
          console.error('Error saving customer:', error);
        }
      }

      setCustomers([...customers, newCustomer]);
    }
    setNewCustomerPhone('');
    setNewCustomerName('');
    setViewStep('list');
  };

  const handleRemoveCustomer = (index: number) => {
    const newCustomers = customers.filter((_, i) => i !== index);
    setCustomers(newCustomers);
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

  const handleSave = () => {
    onSave(customers);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
        {viewStep === 'list' && (
          <>
            <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <SheetTitle className="text-black font-semibold">Trocar cliente</SheetTitle>
              <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-4">
              {/* Current customers */}
              {customers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Clientes atuais:</Label>
                  {customers.map((customer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-800">
                          {customer.name || (customer.phone ? customer.phone : 'Não identificado')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCustomer(index)}
                        className="text-red-500 text-sm font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer slots */}
              <div className={`grid gap-2 ${customerCount > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {customers.length < customerCount && (
                  <button
                    onClick={handleMarkNotIdentified}
                    className="py-3 rounded-lg text-white font-medium bg-cyan-500 hover:bg-cyan-400 transition-colors"
                  >
                    Não identificado
                  </button>
                )}
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

              {/* Save Button */}
              <button
                onClick={handleSave}
                className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
              >
                Salvar
              </button>
            </div>
          </>
        )}

        {viewStep === 'new-customer' && (
          <>
            <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={handleBackToList} className="p-1 text-gray-600 hover:text-gray-800">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <SheetTitle className="text-black font-semibold">Novo cliente</SheetTitle>
              </div>
              <button onClick={handleClose} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </SheetHeader>

            <div className="px-4 pb-6 space-y-4">
              {/* Not Identified Button */}
              <button
                onClick={() => {
                  setCustomers([...customers, { phone: '', name: '', identified: false }]);
                  setViewStep('list');
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
                disabled={!newCustomerPhone && !newCustomerName}
                className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Adicionar cliente
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

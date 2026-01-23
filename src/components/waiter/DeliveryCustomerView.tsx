import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryCustomerViewProps {
  onBack: () => void;
  onAdvance: (phone: string, name: string) => void;
  comandaNumber?: string;
  restaurantId?: string;
}

export const DeliveryCustomerView = ({ onBack, onAdvance, comandaNumber, restaurantId }: DeliveryCustomerViewProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const getCleanPhone = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, '');
  };

  const searchCustomerByPhone = useCallback(async (phoneNumber: string) => {
    if (!restaurantId) return;
    
    const cleanPhone = getCleanPhone(phoneNumber);
    if (cleanPhone.length < 10) return;
    
    setIsSearching(true);
    try {
      // Search in orders first (most recent)
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderData?.customer_name) {
        setName(orderData.customer_name);
        setIsSearching(false);
        return;
      }

      // Search in customer_addresses
      const { data: addressData } = await supabase
        .from('customer_addresses')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (addressData?.customer_name) {
        setName(addressData.customer_name);
        setIsSearching(false);
        return;
      }

      // Search in customer_loyalty
      const { data: loyaltyData } = await supabase
        .from('customer_loyalty')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .maybeSingle();

      if (loyaltyData?.customer_name) {
        setName(loyaltyData.customer_name);
      }
    } catch (error) {
      console.error('Error searching customer:', error);
    } finally {
      setIsSearching(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const cleanPhone = getCleanPhone(phone);
    if (cleanPhone.length >= 10 && !name) {
      const timer = setTimeout(() => {
        searchCustomerByPhone(phone);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [phone, name, searchCustomerByPhone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    // Clear name when phone changes to allow new search
    if (name) setName('');
  };

  const isValid = phone.replace(/\D/g, '').length >= 10 && name.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-semibold">Pedido delivery</h1>
          {comandaNumber && (
            <p className="text-cyan-400 text-sm font-medium">Comanda {comandaNumber}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-4">
        <h2 className="text-lg font-bold text-white mb-6">Identifique o cliente</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-400 mb-2">
              Digite o celular:
            </label>
            <div className="relative">
              <Input
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(__) _____-____"
                className="h-12 bg-slate-300 border-0 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 animate-spin" />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome do cliente:
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-12 bg-slate-300 border-0 text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <button
          onClick={() => onAdvance(phone, name)}
          disabled={!isValid}
          className="w-full py-4 mt-6 bg-slate-400 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-500"
        >
          Avançar
        </button>

        <p className="text-center text-slate-400 mt-8 px-4">
          Finalize o pedido delivery com as informações do cliente, endereço de entrega e forma de pagamento.
        </p>
      </div>
    </div>
  );
};

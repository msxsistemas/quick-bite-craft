import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, User, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Comanda } from '@/hooks/useComandas';
import { supabase } from '@/integrations/supabase/client';

interface ComandaCustomerViewProps {
  comanda: Comanda;
  restaurantId: string;
  hasOrders: boolean;
  onBack: () => void;
  onSave: (phone: string, name: string, identifier: string) => Promise<void>;
  isSaving: boolean;
}

export const ComandaCustomerView = ({
  comanda,
  restaurantId,
  hasOrders,
  onBack,
  onSave,
  isSaving,
}: ComandaCustomerViewProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const getCleanPhone = (formattedPhone: string) => {
    return formattedPhone.replace(/\D/g, '');
  };

  // Keep customer fields empty when there are no orders.
  // Customer data may exist in the database for future auto-fill, but should not prefill this form.
  useEffect(() => {
    if (!hasOrders) {
      setPhone('');
      setName('');
      setIdentifier('');
      return;
    }

    setPhone(comanda.customer_phone ? formatPhone(comanda.customer_phone) : '');
    setName(comanda.customer_name || '');
    setIdentifier('');
  }, [comanda.id, hasOrders]);

  // Search for customer name when phone changes
  const searchCustomerByPhone = useCallback(async (phoneNumber: string) => {
    const cleanPhone = getCleanPhone(phoneNumber);
    if (cleanPhone.length < 10) return;

    setIsSearching(true);
    try {
      // First try orders (most recent customer data)
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .not('customer_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (orderData?.customer_name) {
        setName(orderData.customer_name);
        setIsSearching(false);
        return;
      }

      // Then try comandas
      const { data: comandaData } = await supabase
        .from('comandas')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .not('customer_name', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (comandaData?.customer_name) {
        setName(comandaData.customer_name);
        setIsSearching(false);
        return;
      }

      // Then try customer_addresses
      const { data: addressData } = await supabase
        .from('customer_addresses')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .not('customer_name', 'is', null)
        .limit(1)
        .single();

      if (addressData?.customer_name) {
        setName(addressData.customer_name);
        setIsSearching(false);
        return;
      }

      // Finally try customer_loyalty
      const { data: loyaltyData } = await supabase
        .from('customer_loyalty')
        .select('customer_name')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', cleanPhone)
        .not('customer_name', 'is', null)
        .limit(1)
        .single();

      if (loyaltyData?.customer_name) {
        setName(loyaltyData.customer_name);
      }
    } catch (error) {
      // Customer not found, that's okay
    } finally {
      setIsSearching(false);
    }
  }, [restaurantId]);

  // Debounced search when phone changes
  useEffect(() => {
    const cleanPhone = getCleanPhone(phone);
    // Search when phone is complete (10+ digits) and name is empty
    if (cleanPhone.length >= 10 && !name) {
      const timer = setTimeout(() => {
        searchCustomerByPhone(phone);
      }, 300); // Reduced delay for faster response
      return () => clearTimeout(timer);
    }
  }, [phone, name, searchCustomerByPhone]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSave = async () => {
    await onSave(phone, name, identifier);
  };
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Abrir comanda</h1>
      </header>

      {/* Comanda Info */}
      <div className="bg-[#0d2847] px-4 py-4 border-b border-[#1e4976]">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-lg">Comanda #{comanda.number}</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              hasOrders ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
            }`}
          >
            {hasOrders ? 'Ocupada' : 'Livre'}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 p-4 space-y-6">
        {/* Customer Info Section */}
        <div>
          <h3 className="text-cyan-400 text-sm font-medium mb-3">Informações do cliente</h3>
          
          <div className="space-y-3">
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Número do WhatsApp"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-12 bg-white text-gray-900 border-0 h-12 rounded-lg placeholder:text-gray-400"
              />
            </div>

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Nome e Sobrenome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 bg-white text-gray-900 border-0 h-12 rounded-lg placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Identifier Section */}
        <div>
          <h3 className="text-cyan-400 text-sm font-medium mb-3">Identificador</h3>
          
          <Input
            placeholder="Nome, número ou observação"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.slice(0, 15))}
            maxLength={15}
            className="bg-white text-gray-900 border-0 h-12 rounded-lg placeholder:text-gray-400"
          />
          <p className="text-slate-500 text-xs mt-2">Até 15 caracteres</p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#0a1628]">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-4 bg-cyan-500 rounded-xl text-white font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

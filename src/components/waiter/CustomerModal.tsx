import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Minus, ArrowLeft, Phone, User, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  name: string;
  phone: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onSaveCustomers: (customers: Customer[]) => void;
  restaurantId: string;
  title?: string;
}

type ModalView = 'list' | 'edit';

export const CustomerModal = ({
  isOpen,
  onClose,
  customers,
  onSaveCustomers,
  restaurantId,
  title = 'Informar cliente',
}: CustomerModalProps) => {
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers.length > 0 ? customers : [{ name: '', phone: '' }]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [view, setView] = useState<ModalView>('list');
  const [editPhone, setEditPhone] = useState('');
  const [editName, setEditName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalCustomers(customers.length > 0 ? customers : [{ name: '', phone: '' }]);
      setView('list');
      setSelectedIndex(null);
    }
  }, [isOpen, customers]);

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
        setEditName(orderData.customer_name);
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
        setEditName(comandaData.customer_name);
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
        setEditName(addressData.customer_name);
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
        setEditName(loyaltyData.customer_name);
      }
    } catch (error) {
      // Customer not found, that's okay
    } finally {
      setIsSearching(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    const cleanPhone = getCleanPhone(editPhone);
    if (cleanPhone.length >= 10 && !editName) {
      const timer = setTimeout(() => {
        searchCustomerByPhone(editPhone);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [editPhone, editName, searchCustomerByPhone]);

  const handleSelectCustomer = (index: number) => {
    setSelectedIndex(index);
    const customer = localCustomers[index];
    setEditPhone(customer.phone ? formatPhone(customer.phone) : '');
    setEditName(customer.name || '');
    setView('edit');
  };

  const handleAddCustomer = () => {
    setLocalCustomers([...localCustomers, { name: '', phone: '' }]);
  };

  const handleRemoveCustomerSlot = () => {
    if (localCustomers.length > 1) {
      setLocalCustomers(localCustomers.slice(0, -1));
    }
  };

  const handleSaveEdit = () => {
    if (selectedIndex === null) return;
    
    const cleanPhone = getCleanPhone(editPhone);
    const updated = [...localCustomers];
    updated[selectedIndex] = { name: editName, phone: cleanPhone };
    setLocalCustomers(updated);
    onSaveCustomers(updated.filter(c => c.name || c.phone));
    setView('list');
    onClose();
  };

  const handleRemoveCustomer = () => {
    if (selectedIndex === null) return;
    
    const updated = [...localCustomers];
    updated[selectedIndex] = { name: '', phone: '' };
    setLocalCustomers(updated);
    onSaveCustomers(updated.filter(c => c.name || c.phone));
    setView('list');
    onClose();
  };

  if (!isOpen) return null;

  const displayName = (customer: Customer) => {
    if (customer.name) {
      return customer.name;
    }
    return 'Não identificado';
  };

  const displayPhone = (customer: Customer) => {
    if (customer.phone) {
      return formatPhone(customer.phone);
    }
    return '';
  };

  if (view === 'edit') {
    const customer = selectedIndex !== null ? localCustomers[selectedIndex] : null;
    const isNewCustomer = customer && !customer.name && !customer.phone;
    
    return (
      <div 
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-[99%] max-w-none bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <button onClick={() => setView('list')} className="p-1 hover:bg-gray-100 rounded">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="font-semibold text-gray-900">Trocar cliente</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Selected Customer Button */}
          <div className="p-4">
            <button className="w-full py-3 bg-[#0ea5e9] text-white font-medium rounded-lg">
              {isNewCustomer ? 'Não identificado' : displayName(customer!)}
            </button>
          </div>

          {/* Form */}
          <div className="px-4 pb-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Novo cliente:
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                  placeholder="Número do WhatsApp"
                  className="pl-10 h-12 border-gray-300"
                />
              </div>
            </div>

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Não identificado"
                className="pl-10 h-12 border-gray-300"
              />
            </div>

            <button
              onClick={handleSaveEdit}
              className="w-full py-4 bg-[#0ea5e9] text-white font-bold rounded-lg hover:bg-[#0ea5e9]/90 transition-colors"
            >
              Salvar
            </button>

            {!isNewCustomer && (
              <button
                onClick={handleRemoveCustomer}
                className="w-full py-4 border-2 border-[#0ea5e9] text-[#0ea5e9] font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#0ea5e9]/5 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Remover cliente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[99%] max-w-none bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Customer Buttons */}
        <div className="p-4">
          <div className={`grid gap-2 ${localCustomers.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {localCustomers.map((customer, index) => {
              const hasData = customer.name || customer.phone;
              return (
                <button
                  key={index}
                  onClick={() => handleSelectCustomer(index)}
                  className={`py-3 px-4 rounded-lg font-medium text-center transition-colors ${
                    hasData 
                      ? 'bg-[#0ea5e9] text-white' 
                      : 'bg-[#bae6fd] text-[#0369a1]'
                  }`}
                >
                  <div>{displayName(customer)}</div>
                  {customer.phone && (
                    <div className="text-sm opacity-90">{displayPhone(customer)}</div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-center gap-4 py-3 border-y border-gray-200">
          <button
            onClick={handleRemoveCustomerSlot}
            disabled={localCustomers.length <= 1}
            className="w-8 h-8 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-gray-900 font-medium w-6 text-center">{localCustomers.length}</span>
          <button
            onClick={handleAddCustomer}
            className="w-8 h-8 rounded-full bg-[#0ea5e9] text-white flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Customer Button */}
        <div className="p-4">
          <button
            onClick={handleAddCustomer}
            className="w-full py-3 border-2 border-[#0ea5e9] text-[#0ea5e9] font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-[#0ea5e9]/5 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Novo cliente
          </button>
        </div>
      </div>
    </div>
  );
};

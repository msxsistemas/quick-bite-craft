import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DeliveryCustomerViewProps {
  onBack: () => void;
  onAdvance: (phone: string, name: string) => void;
  comandaNumber?: string;
}

export const DeliveryCustomerView = ({ onBack, onAdvance, comandaNumber }: DeliveryCustomerViewProps) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
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
            <Input
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(__) _____-____"
              className="h-12 bg-slate-300 border-0 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome do cliente:
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-12 bg-slate-300 border-0 text-gray-900 placeholder:text-gray-500"
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

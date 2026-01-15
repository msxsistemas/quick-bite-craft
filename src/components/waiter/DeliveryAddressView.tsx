import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface DeliveryAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
  complement?: string;
}

interface DeliveryAddressViewProps {
  onBack: () => void;
  onSave: (address: DeliveryAddress) => void;
  onShowZones: () => void;
}

export const DeliveryAddressView = ({ onBack, onSave, onShowZones }: DeliveryAddressViewProps) => {
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [noNumber, setNoNumber] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [reference, setReference] = useState('');
  const [complement, setComplement] = useState('');

  const isValid = street.trim() && (number.trim() || noNumber) && neighborhood.trim() && city.trim();

  const handleSave = () => {
    if (!isValid) return;
    
    onSave({
      street: street.trim(),
      number: noNumber ? 'S/N' : number.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      reference: reference.trim() || undefined,
      complement: complement.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Novo endereço</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Region */}
        <div className="p-4 bg-[#0d2847] flex items-center justify-between">
          <span className="text-amber-400 font-medium">Região</span>
          <button 
            onClick={onShowZones}
            className="px-4 py-2 border border-white text-white rounded-lg text-sm hover:bg-white/10 transition-colors"
          >
            Ver opções
          </button>
        </div>

        {/* Address Form */}
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium">
            Endereço de entrega
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-400 mb-2">
                Rua *
              </label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Avenida Brasil"
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-400 mb-2">
                Número *
              </label>
              <Input
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1234"
                disabled={noNumber}
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
              />
              <div className="flex items-center gap-2 mt-2">
                <Checkbox 
                  id="no-number"
                  checked={noNumber}
                  onCheckedChange={(checked) => setNoNumber(!!checked)}
                />
                <label htmlFor="no-number" className="text-sm text-white">
                  Sem número
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-400 mb-2">
                Bairro *
              </label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-400 mb-2">
                Cidade *
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Porto Alegre, Curitiba..."
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ponto de referência
              </label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Em frente ao..."
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Complemento
              </label>
              <Input
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Casa, Apto, Sala X..."
                className="h-12 bg-white border-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1628]">
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="w-full py-4 bg-cyan-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

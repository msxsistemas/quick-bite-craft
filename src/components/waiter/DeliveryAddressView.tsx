import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CepInput, isValidCep, getCepDigits } from '@/components/ui/cep-input';
import { CustomerAddress } from '@/hooks/useCustomerAddresses';

export interface DeliveryAddress {
  id?: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
  complement?: string;
  cep?: string;
  label?: string;
}

interface DeliveryAddressViewProps {
  onBack: () => void;
  onSave: (address: DeliveryAddress) => void;
  onShowZones: () => void;
  editingAddress?: CustomerAddress | null;
  selectedZone?: { id: string; name: string; fee: number } | null;
}

export const DeliveryAddressView = ({ onBack, onSave, onShowZones, editingAddress, selectedZone }: DeliveryAddressViewProps) => {
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [noNumber, setNoNumber] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [reference, setReference] = useState('');
  const [complement, setComplement] = useState('');
  const [label, setLabel] = useState('Casa');
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepStatus, setCepStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  // Load editing address data
  useEffect(() => {
    if (editingAddress) {
      setCep(editingAddress.cep || '');
      setStreet(editingAddress.street);
      setNumber(editingAddress.number === 'S/N' ? '' : editingAddress.number);
      setNoNumber(editingAddress.number === 'S/N');
      setNeighborhood(editingAddress.neighborhood);
      setCity(editingAddress.city);
      setComplement(editingAddress.complement || '');
      setLabel(editingAddress.label || 'Casa');
      if (editingAddress.cep && editingAddress.cep.length === 8) {
        setCepStatus('valid');
      }
    }
  }, [editingAddress]);

  const searchCep = useCallback(async (cepDigits: string) => {
    if (cepDigits.length !== 8) {
      setCepStatus('idle');
      return;
    }
    
    setIsSearchingCep(true);
    setCepStatus('idle');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setCepStatus('valid');
      } else {
        setCepStatus('invalid');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setCepStatus('invalid');
    } finally {
      setIsSearchingCep(false);
    }
  }, []);

  const isValid = street.trim() && (number.trim() || noNumber) && neighborhood.trim() && city.trim();

  const handleSave = () => {
    if (!isValid) return;
    
    onSave({
      id: editingAddress?.id,
      street: street.trim(),
      number: noNumber ? 'S/N' : number.trim(),
      neighborhood: neighborhood.trim(),
      city: city.trim(),
      reference: reference.trim() || undefined,
      complement: complement.trim() || undefined,
      cep: getCepDigits(cep) || undefined,
      label: label.trim() || 'Casa',
    });
  };

  const handleCepComplete = (cepDigits: string) => {
    searchCep(cepDigits);
  };

  const handleCepChange = (value: string) => {
    setCep(value);
    const digits = getCepDigits(value);
    if (digits.length < 8) {
      setCepStatus('idle');
    }
  };

  const labelOptions = ['Casa', 'Trabalho', 'Apartamento', 'Outro'];

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
        <h1 className="text-white font-semibold">{editingAddress ? 'Editar endereço' : 'Novo endereço'}</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Region */}
        <div className="p-4 bg-[#0d2847] border-b border-[#1e4976]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-white font-medium">Região</span>
              {selectedZone ? (
                <p className="text-cyan-400 text-sm mt-0.5">{selectedZone.name}</p>
              ) : (
                <p className="text-slate-400 text-sm mt-0.5">Nenhuma selecionada</p>
              )}
            </div>
            <button 
              onClick={onShowZones}
              className="px-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/10 transition-colors"
            >
              Ver opções
            </button>
          </div>
        </div>

        {/* Address Form */}
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium">
            Endereço de entrega
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0 p-4 space-y-4">
            {/* Label selector */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nome do endereço
              </label>
              <div className="flex flex-wrap gap-2">
                {labelOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLabel(option)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      label === option
                        ? 'bg-cyan-500 text-white'
                        : 'bg-[#1e3a5f] text-slate-300 hover:bg-[#2a4a6f]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                CEP
              </label>
              <div className="relative">
                <CepInput
                  value={cep}
                  onChange={handleCepChange}
                  onCepComplete={handleCepComplete}
                  className={`h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400 pr-10 ${
                    cepStatus === 'valid' ? '!ring-2 !ring-green-500' : 
                    cepStatus === 'invalid' ? '!ring-2 !ring-red-500' : ''
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearchingCep && (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  )}
                  {!isSearchingCep && cepStatus === 'valid' && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {!isSearchingCep && cepStatus === 'invalid' && (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {cepStatus === 'invalid' && (
                <p className="text-red-400 text-xs mt-1">CEP não encontrado</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Rua *
              </label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Avenida Brasil"
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Número *
              </label>
              <Input
                value={noNumber ? "S/N" : number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1234"
                disabled={noNumber}
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400 disabled:bg-white disabled:opacity-100"
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
              <label className="block text-sm font-medium text-white mb-2">
                Bairro *
              </label>
              <Input
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Cidade *
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Porto Alegre, Curitiba..."
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400"
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
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400"
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
                className="h-12 bg-white !border-0 !ring-0 !ring-offset-0 focus-visible:!ring-0 text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0d2847]">
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
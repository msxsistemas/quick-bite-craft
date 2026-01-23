import { ArrowLeft, MapPin, Home, Briefcase, Building, Plus, Check, Pencil, Trash2, Loader2 } from 'lucide-react';
import { CustomerAddress } from '@/hooks/useCustomerAddresses';

interface SavedAddressSelectorViewProps {
  addresses: CustomerAddress[];
  isLoading: boolean;
  onBack: () => void;
  onSelect: (address: CustomerAddress) => void;
  onEdit: (address: CustomerAddress) => void;
  onDelete: (address: CustomerAddress) => void;
  onAddNew: () => void;
  selectedAddressId?: string;
}

const getAddressIcon = (label: string) => {
  switch (label?.toLowerCase()) {
    case 'casa':
      return <Home className="w-5 h-5" />;
    case 'trabalho':
      return <Briefcase className="w-5 h-5" />;
    case 'apartamento':
      return <Building className="w-5 h-5" />;
    default:
      return <MapPin className="w-5 h-5" />;
  }
};

export const SavedAddressSelectorView = ({
  addresses,
  isLoading,
  onBack,
  onSelect,
  onEdit,
  onDelete,
  onAddNew,
  selectedAddressId,
}: SavedAddressSelectorViewProps) => {
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
        <h1 className="text-white font-semibold">Endereços salvos</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium">
            Selecione um endereço
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0 p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              </div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                <p className="text-slate-400 mb-4">Nenhum endereço salvo</p>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedAddressId === address.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-[#1e4976] bg-[#1e3a5f]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`mt-0.5 ${selectedAddressId === address.id ? 'text-cyan-400' : 'text-slate-400'}`}>
                        {getAddressIcon(address.label)}
                      </div>
                      
                      {/* Address info - clickable area */}
                      <button
                        onClick={() => onSelect(address)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white">{address.label || 'Endereço'}</span>
                          {address.is_default && (
                            <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">
                              Padrão
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 truncate">
                          {address.street}, {address.number}
                          {address.complement && ` - ${address.complement}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {address.neighborhood}, {address.city}
                        </p>
                        {address.cep && (
                          <p className="text-xs text-slate-500">CEP: {address.cep}</p>
                        )}
                      </button>
                      
                      {/* Selected check */}
                      {selectedAddressId === address.id && (
                        <Check className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1e4976]">
                      <button
                        onClick={() => onEdit(address)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(address)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0d2847]">
        <button
          onClick={onAddNew}
          className="w-full py-4 bg-cyan-500 text-white rounded-xl font-medium hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Adicionar novo endereço
        </button>
      </div>
    </div>
  );
};

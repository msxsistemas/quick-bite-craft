import { useState } from 'react';
import { MapPin, Check, Plus, Home, Building, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerAddress } from '@/hooks/useCustomerAddresses';

interface SavedAddressSelectorProps {
  addresses: CustomerAddress[];
  onSelect: (address: CustomerAddress) => void;
  onAddNew: () => void;
  selectedAddressId?: string;
}

const getAddressIcon = (label: string) => {
  switch (label.toLowerCase()) {
    case 'casa':
      return <Home className="w-4 h-4" />;
    case 'trabalho':
      return <Briefcase className="w-4 h-4" />;
    case 'apartamento':
      return <Building className="w-4 h-4" />;
    default:
      return <MapPin className="w-4 h-4" />;
  }
};

export const SavedAddressSelector = ({
  addresses,
  onSelect,
  onAddNew,
  selectedAddressId,
}: SavedAddressSelectorProps) => {
  if (addresses.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 mb-4">
      <p className="text-sm font-medium text-muted-foreground">Endereços salvos</p>
      <div className="space-y-2">
        {addresses.map((address) => (
          <button
            key={address.id}
            onClick={() => onSelect(address)}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
              selectedAddressId === address.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 ${selectedAddressId === address.id ? 'text-primary' : 'text-muted-foreground'}`}>
                {getAddressIcon(address.label)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{address.label}</span>
                  {address.is_default && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {address.street}, {address.number}
                  {address.complement && ` - ${address.complement}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {address.neighborhood}, {address.city}
                </p>
              </div>
              {selectedAddressId === address.id && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAddNew}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Usar outro endereço
      </Button>
    </div>
  );
};

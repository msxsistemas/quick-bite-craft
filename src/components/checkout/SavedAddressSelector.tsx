import { useState } from 'react';
import { MapPin, Check, Plus, Home, Building, Briefcase, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomerAddress } from '@/hooks/useCustomerAddresses';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';

interface SavedAddressSelectorProps {
  addresses: CustomerAddress[];
  onSelect: (address: CustomerAddress) => void;
  onAddNew: () => void;
  onEdit?: (address: CustomerAddress) => void;
  onDelete?: (address: CustomerAddress) => void;
  selectedAddressId?: string;
  isDeleting?: boolean;
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
  onEdit,
  onDelete,
  selectedAddressId,
  isDeleting = false,
}: SavedAddressSelectorProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);

  if (addresses.length === 0) {
    return null;
  }

  const handleDeleteClick = (e: React.MouseEvent, address: CustomerAddress) => {
    e.stopPropagation();
    setAddressToDelete(address);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (addressToDelete && onDelete) {
      onDelete(addressToDelete);
    }
    setDeleteDialogOpen(false);
    setAddressToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent, address: CustomerAddress) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(address);
    }
  };

  return (
    <>
      <div className="space-y-3 mb-4">
        <p className="text-sm font-medium text-muted-foreground">Endereços salvos</p>
        <div className="space-y-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                selectedAddressId === address.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onSelect(address)}
                  className="flex-1 flex items-start gap-3 text-left"
                >
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
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                  )}
                </button>
                
                {/* Action buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onEdit && (
                    <button
                      onClick={(e) => handleEditClick(e, address)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Editar endereço"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => handleDeleteClick(e, address)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Excluir endereço"
                      disabled={isDeleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
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

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir endereço?"
        description={`Tem certeza que deseja excluir o endereço "${addressToDelete?.label}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </>
  );
};

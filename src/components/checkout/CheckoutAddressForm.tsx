import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CepInput } from '@/components/ui/cep-input';
import { Star, ChevronLeft } from 'lucide-react';
import { AddressFormData } from '@/types/checkout';

interface CheckoutAddressFormProps {
  formData: AddressFormData;
  onFormChange: (data: Partial<AddressFormData>) => void;
  onCepComplete: (cep: string) => void;
  isLoadingCep: boolean;
  isEditing: boolean;
  showSaveOption: boolean;
  saveNewAddress: boolean;
  onSaveNewAddressChange: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  errors?: Record<string, string>;
}

export const CheckoutAddressForm = ({
  formData,
  onFormChange,
  onCepComplete,
  isLoadingCep,
  isEditing,
  showSaveOption,
  saveNewAddress,
  onSaveNewAddressChange,
  onSave,
  onCancel,
  isSaving,
  errors = {},
}: CheckoutAddressFormProps) => {
  return (
    <div className="pt-4 space-y-4">
      <h3 className="font-semibold text-lg">
        {isEditing ? 'Editar endereço' : 'Novo endereço'}
      </h3>
      
      <div>
        <Label htmlFor="cep-inline" className="text-muted-foreground">CEP</Label>
        <div className="relative">
          <CepInput
            id="cep-inline"
            value={formData.cep}
            onChange={(value) => onFormChange({ cep: value })}
            onCepComplete={onCepComplete}
            className={errors.cep ? 'border-destructive' : ''}
          />
          {isLoadingCep && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="street-inline" className="text-muted-foreground">Rua</Label>
        <Input
          id="street-inline"
          value={formData.street}
          onChange={(e) => onFormChange({ street: e.target.value })}
          placeholder="Nome da rua"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="number-inline" className="text-muted-foreground">Número</Label>
          <Input
            id="number-inline"
            value={formData.number}
            onChange={(e) => onFormChange({ number: e.target.value })}
            placeholder="123"
          />
        </div>
        <div>
          <Label htmlFor="complement-inline" className="text-muted-foreground">Complemento</Label>
          <Input
            id="complement-inline"
            value={formData.complement}
            onChange={(e) => onFormChange({ complement: e.target.value })}
            placeholder="Apto, bloco..."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="neighborhood-inline" className="text-muted-foreground">Bairro</Label>
        <Input
          id="neighborhood-inline"
          value={formData.neighborhood}
          onChange={(e) => onFormChange({ neighborhood: e.target.value })}
          placeholder="Nome do bairro"
        />
      </div>

      <div>
        <Label htmlFor="city-inline" className="text-muted-foreground">Cidade</Label>
        <Input
          id="city-inline"
          value={formData.city}
          onChange={(e) => onFormChange({ city: e.target.value })}
          placeholder="Cidade - UF"
        />
      </div>

      {/* Address Label */}
      <div>
        <Label className="text-muted-foreground">Nome do endereço</Label>
        <div className="flex gap-2 mt-2">
          {['Casa', 'Trabalho'].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => onFormChange({ label })}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                formData.label === label
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Save Address Option - Only for new addresses */}
      {showSaveOption && !isEditing && (
        <div className="flex items-center space-x-3">
          <Checkbox
            id="saveAddress-inline"
            checked={saveNewAddress}
            onCheckedChange={(checked) => onSaveNewAddressChange(checked === true)}
          />
          <Label 
            htmlFor="saveAddress-inline" 
            className="text-sm font-medium cursor-pointer"
          >
            Salvar endereço para próximos pedidos
          </Label>
        </div>
      )}

      {/* Set as default option - Only when editing */}
      {isEditing && (
        <div className="flex items-center space-x-3">
          <Checkbox
            id="isDefaultAddress-inline"
            checked={formData.isDefault}
            onCheckedChange={(checked) => onFormChange({ isDefault: checked === true })}
          />
          <Label 
            htmlFor="isDefaultAddress-inline" 
            className="text-sm font-medium cursor-pointer flex items-center gap-2"
          >
            <Star className="w-4 h-4 text-amber-500" />
            Definir como endereço padrão
          </Label>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={onSave}
          disabled={!formData.street || !formData.number || !formData.neighborhood || !formData.city || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : null}
          {isEditing ? 'Salvar alterações' : 'Usar este endereço'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onCancel}
          className="w-full"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    </div>
  );
};

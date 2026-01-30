import { Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PhoneInput, isValidPhone } from '@/components/ui/phone-input';

interface CustomerDataCardProps {
  customerName: string;
  customerPhone: string;
  onNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  addressesLoading: boolean;
  savedAddressesCount: number;
}

export const CustomerDataCard: React.FC<CustomerDataCardProps> = ({
  customerName,
  customerPhone,
  onNameChange,
  onPhoneChange,
  errors,
  setErrors,
  addressesLoading,
  savedAddressesCount,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onNameChange(value);
    if (value.trim().length >= 2 && errors.name) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.name;
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    onPhoneChange(value);
    if (isValidPhone(value) && errors.phone) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.phone;
        return newErrors;
      });
    }
  };

  return (
    <div className="overflow-hidden">
      <div className="bg-primary text-primary-foreground rounded-t-2xl px-4 py-3.5">
        <h3 className="font-semibold text-base">Dados do cliente</h3>
      </div>
      <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl px-4 py-5 space-y-4">
        <div>
          <Label htmlFor="name" className="text-xs text-gray-500 font-normal mb-1.5 block">
            Nome completo
          </Label>
          <Input
            id="name"
            value={customerName}
            onChange={handleNameChange}
            placeholder="Seu nome"
            className={`h-12 border border-input rounded-xl bg-white px-4 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${errors.name ? 'border-destructive' : ''}`}
          />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs text-gray-500 font-normal mb-1.5 block">
            Telefone
          </Label>
          <div className="relative">
            <PhoneInput
              id="phone"
              value={customerPhone}
              onChange={handlePhoneChange}
              className={`h-12 border border-input rounded-xl bg-white px-4 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${errors.phone ? 'border-destructive' : ''}`}
            />
            {isValidPhone(customerPhone) && addressesLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
            )}
            {isValidPhone(customerPhone) && !addressesLoading && savedAddressesCount > 0 && (
              <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
            )}
          </div>
          {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
          {isValidPhone(customerPhone) && !addressesLoading && savedAddressesCount > 0 && (
            <p className="text-xs text-green-600 mt-1.5">
              {savedAddressesCount} endereço{savedAddressesCount > 1 ? 's' : ''} encontrado{savedAddressesCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

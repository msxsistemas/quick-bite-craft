import { Banknote, CreditCard } from 'lucide-react';
import pixLogo from '@/assets/pix-logo.png';
import { PaymentMethod } from '@/types/checkout';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  selected: boolean;
  onClick: () => void;
  showDescription?: boolean;
}

export const PaymentMethodCard = ({
  method,
  selected,
  onClick,
  showDescription = true,
}: PaymentMethodCardProps) => {
  const getIcon = () => {
    switch (method) {
      case 'pix':
        return (
          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
          </div>
        );
      case 'cash':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <Banknote className="w-4 h-4 text-white" />
          </div>
        );
      case 'card':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-gray-600" />
          </div>
        );
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (method) {
      case 'pix':
        return 'Pix';
      case 'cash':
        return 'Dinheiro';
      case 'card':
        return 'Cartão';
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (method) {
      case 'pix':
        return 'Aprovação automática';
      default:
        return null;
    }
  };

  const description = getDescription();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
        selected ? 'border-gray-900' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="text-left">
          <span className="font-medium text-gray-900">{getLabel()}</span>
          {showDescription && description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-gray-900' : 'border-gray-300'
      }`}>
        {selected && <div className="w-3 h-3 rounded-full bg-gray-900" />}
      </div>
    </button>
  );
};

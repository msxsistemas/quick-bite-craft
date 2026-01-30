import { OrderTypeSelection } from '@/types/checkout';

interface OrderTypeButtonProps {
  type: 'delivery' | 'pickup' | 'dine-in';
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export const OrderTypeButton = ({
  type,
  label,
  selected,
  onClick,
  className = '',
}: OrderTypeButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50 ${className}`}
    >
      <span className="font-medium text-gray-900">{label}</span>
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
        selected ? 'border-gray-900' : 'border-gray-300'
      }`}>
        {selected && <div className="w-3 h-3 rounded-full bg-gray-900" />}
      </div>
    </button>
  );
};

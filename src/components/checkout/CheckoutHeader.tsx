import { ArrowLeft } from 'lucide-react';

interface CheckoutHeaderProps {
  step: 'details' | 'payment' | 'review';
  onBack: () => void;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ step, onBack }) => {
  const getTitle = () => {
    switch (step) {
      case 'review':
        return 'Carrinho';
      case 'payment':
        return 'Pagamento';
      default:
        return 'Finalizar Pedido';
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
      <button 
        type="button"
        onClick={onBack}
        className="p-2 -ml-2 touch-manipulation"
      >
        <ArrowLeft className="w-6 h-6 text-muted-foreground" />
      </button>
      <h1 className="text-base font-bold uppercase tracking-wide">
        {getTitle()}
      </h1>
      <div className="w-6" />
    </div>
  );
};

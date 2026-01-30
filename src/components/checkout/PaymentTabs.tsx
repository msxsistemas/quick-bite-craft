import { PaymentTab } from '@/types/checkout';

interface PaymentTabsProps {
  activeTab: PaymentTab;
  onTabChange: (tab: PaymentTab) => void;
}

export const PaymentTabs = ({ activeTab, onTabChange }: PaymentTabsProps) => {
  return (
    <div className="flex border-b border-gray-200">
      <button
        onClick={() => onTabChange('online')}
        className={`flex-1 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'online' 
            ? 'text-primary' 
            : 'text-gray-500'
        }`}
      >
        Pagar pelo app
        {activeTab === 'online' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        )}
      </button>
      <button
        onClick={() => onTabChange('delivery')}
        className={`flex-1 py-4 text-center font-medium transition-colors relative ${
          activeTab === 'delivery' 
            ? 'text-primary' 
            : 'text-gray-500'
        }`}
      >
        Pagar na entrega
        {activeTab === 'delivery' && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
        )}
      </button>
    </div>
  );
};

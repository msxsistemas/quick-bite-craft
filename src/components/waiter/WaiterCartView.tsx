import { useState } from 'react';
import { ArrowLeft, Trash2, Edit2, Plus, Users, Minus, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { CustomerModal } from './CustomerModal';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image_url?: string | null;
}

interface Customer {
  name: string;
  phone: string;
}

interface WaiterCartViewProps {
  tableName: string;
  items: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
  onAddItems: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onEditItem: (productId: string) => void;
  onConfirmOrder: (customers?: Customer[]) => void;
  isProcessing: boolean;
  restaurantId?: string;
  initialCustomers?: Customer[];
}

export const WaiterCartView = ({
  tableName,
  items,
  onBack,
  onClearCart,
  onAddItems,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  onConfirmOrder,
  isProcessing,
  restaurantId = '',
  initialCustomers = [],
}: WaiterCartViewProps) => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  
  const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleSaveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
  };

  const handleRemoveAllCustomers = () => {
    setCustomers([]);
  };

  const hasCustomers = customers.length > 0 && customers.some(c => c.name || c.phone);
  const primaryCustomer = customers[0];

  // Get product icon/emoji based on name
  const getProductIcon = (name: string, imageUrl?: string | null) => {
    if (imageUrl) {
      return (
        <img 
          src={imageUrl} 
          alt={name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      );
    }
    
    // Simple emoji detection based on common product names
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hambur') || lowerName.includes('burger')) return '🍔';
    if (lowerName.includes('pizza')) return '🍕';
    if (lowerName.includes('refrigerante') || lowerName.includes('coca') || lowerName.includes('pepsi')) return '🥤';
    if (lowerName.includes('suco')) return '🧃';
    if (lowerName.includes('cerveja')) return '🍺';
    if (lowerName.includes('água') || lowerName.includes('agua')) return '💧';
    if (lowerName.includes('café') || lowerName.includes('cafe')) return '☕';
    if (lowerName.includes('sorvete') || lowerName.includes('açaí') || lowerName.includes('acai')) return '🍨';
    if (lowerName.includes('fritas') || lowerName.includes('batata')) return '🍟';
    if (lowerName.includes('hot dog') || lowerName.includes('cachorro')) return '🌭';
    if (lowerName.includes('salada')) return '🥗';
    if (lowerName.includes('frango')) return '🍗';
    if (lowerName.includes('peixe') || lowerName.includes('sushi')) return '🍣';
    if (lowerName.includes('taco') || lowerName.includes('burrito')) return '🌮';
    if (lowerName.includes('sanduíche') || lowerName.includes('sanduiche') || lowerName.includes('lanche')) return '🥪';
    if (lowerName.includes('pastel')) return '🥟';
    if (lowerName.includes('coxinha')) return '🍗';
    if (lowerName.includes('bolo') || lowerName.includes('torta')) return '🍰';
    if (lowerName.includes('sobremesa') || lowerName.includes('doce')) return '🍮';
    return '🍽️';
  };

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-3 flex items-center justify-between sticky top-0 z-20 h-10">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 text-white hover:bg-[#1e4976] rounded transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-white font-medium text-sm">{tableName}</h1>
        </div>
        <button 
          onClick={onClearCart}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors px-3 py-1.5 border border-[#1e4976] rounded-lg hover:border-red-400/50 hover:bg-red-400/10"
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-sm">Limpar</span>
        </button>
      </header>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto pb-32">
        {items.map((item) => {
          const icon = getProductIcon(item.productName, item.image_url);
          const isEmoji = typeof icon === 'string';
          
          return (
            <div key={item.productId} className="px-4 py-4 border-b border-[#1e4976]/30">
              <div className="flex items-start gap-3">
                {/* Product Icon/Image */}
                <div className="w-12 h-12 rounded-lg bg-[#0a1929] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {isEmoji ? (
                    <span className="text-2xl">{icon}</span>
                  ) : (
                    icon
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">{item.quantity}x {item.productName}</p>
                      <p className="text-white">{formatCurrency(item.productPrice * item.quantity)}</p>
                      <button 
                        onClick={() => onEditItem(item.productId)}
                        className="text-green-500 text-sm flex items-center gap-1 mt-1 hover:text-green-400 transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                    </div>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-[#0a1929] rounded-lg px-2 py-1">
                      {item.quantity > 1 ? (
                        <button 
                          onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onRemoveItem(item.productId)}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-white font-medium w-6 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        className="p-1 bg-green-500 rounded-full text-white hover:bg-green-400 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Items Button - Styled like reference */}
        <div className="px-4 pt-4">
          <button
            onClick={onAddItems}
            className="w-full py-4 border border-[#1e4976] text-slate-400 flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-colors rounded-lg bg-transparent"
          >
            <Plus className="w-5 h-5" />
            Adicionar itens
          </button>
        </div>

        {/* Client Section */}
        <div className="px-4 py-4 bg-[#0d2847] border-t border-[#1e4976] mt-4">
          {hasCustomers ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{primaryCustomer.name || 'Cliente'}</p>
                {primaryCustomer.phone && (
                  <p className="text-slate-400 text-sm">{formatPhone(primaryCustomer.phone)}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Trocar</span>
                </button>
                <button 
                  onClick={handleRemoveAllCustomers}
                  className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-5 h-5" />
                <span>Cliente</span>
                <span className="text-xs">(opcional)</span>
              </div>
              <button 
                onClick={() => setIsCustomerModalOpen(true)}
                className="text-white font-medium"
              >
                Adicionar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 pb-4 px-4 bg-[#0d2847]">
        <button
          onClick={() => onConfirmOrder(customers)}
          disabled={items.length === 0 || isProcessing}
          className="w-full py-4 bg-cyan-500 text-white font-bold flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors rounded-lg"
        >
          <span>Gerar pedido</span>
          <span>{formatCurrency(total)}</span>
        </button>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        onSaveCustomers={handleSaveCustomers}
        restaurantId={restaurantId}
        title={hasCustomers ? 'Trocar cliente' : 'Informar cliente'}
      />
    </div>
  );
};

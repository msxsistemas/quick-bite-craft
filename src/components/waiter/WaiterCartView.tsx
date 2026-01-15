import { useState } from 'react';
import { ArrowLeft, Trash2, Edit2, Plus, Users, Minus, PlusCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Utensils } from 'lucide-react';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image_url?: string | null;
}

interface WaiterCartViewProps {
  tableName: string;
  items: CartItem[];
  onBack: () => void;
  onClearCart: () => void;
  onAddItems: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onConfirmOrder: () => void;
  isProcessing: boolean;
}

export const WaiterCartView = ({
  tableName,
  items,
  onBack,
  onClearCart,
  onAddItems,
  onUpdateQuantity,
  onRemoveItem,
  onConfirmOrder,
  isProcessing,
}: WaiterCartViewProps) => {
  const total = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">{tableName}</h1>
        </div>
        <button 
          onClick={onClearCart}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <Trash2 className="w-5 h-5" />
          <span className="text-sm">Limpar</span>
        </button>
      </header>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto pb-32">
        {items.map((item) => (
          <div key={item.productId} className="px-4 py-4 border-b border-[#1e4976]/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0d2847] flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-cyan-400" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium">{item.quantity}x {item.productName}</p>
                    <p className="text-white">{formatCurrency(item.productPrice * item.quantity)}</p>
                    <button className="text-green-500 text-sm flex items-center gap-1 mt-1">
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onRemoveItem(item.productId)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
        ))}

        {/* Add Items Button */}
        <button
          onClick={onAddItems}
          className="w-full px-4 py-4 border-2 border-dashed border-[#1e4976] text-slate-400 flex items-center justify-center gap-2 hover:border-cyan-500 hover:text-cyan-400 transition-colors m-4 rounded-xl"
          style={{ width: 'calc(100% - 2rem)' }}
        >
          <Plus className="w-5 h-5" />
          Adicionar itens
        </button>

        {/* Client Section */}
        <div className="px-4 py-4 bg-[#0d2847] border-y border-[#1e4976]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-5 h-5" />
              <span>Cliente</span>
              <span className="text-xs">(opcional)</span>
            </div>
            <button className="text-white font-medium">Adicionar</button>
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0">
        <button
          onClick={onConfirmOrder}
          disabled={items.length === 0 || isProcessing}
          className="w-full py-4 bg-cyan-500 text-white font-bold flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
        >
          <span>Gerar pedido</span>
          <span>{formatCurrency(total)}</span>
        </button>
      </div>
    </div>
  );
};

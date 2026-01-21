import { useState } from 'react';
import { ArrowLeft, Search, Minus, Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/format';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
}

interface WaiterEditItemViewProps {
  item: CartItem;
  onBack: () => void;
  onSave: (updatedItem: CartItem) => void;
}

export const WaiterEditItemView = ({ item, onBack, onSave }: WaiterEditItemViewProps) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [notes, setNotes] = useState(item.notes || '');

  const handleSave = () => {
    onSave({
      ...item,
      quantity,
      notes: notes.trim() || undefined
    });
  };

  const total = item.productPrice * quantity;

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <div className="bg-[#0d2847] p-4 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-medium">Editar item e observação</span>
        </div>
        <button className="text-slate-400">
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 border-b border-[#1e4976]/30">
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.productName}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#0a1929] flex items-center justify-center text-xl">
              🍔
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-medium">{item.productName}</p>
          </div>
          <p className="text-white font-medium">{formatCurrency(item.productPrice)}</p>
        </div>
      </div>

      {/* Notes */}
      <div className="p-4 flex-1">
        <label className="text-white text-sm font-medium block mb-2">Observações</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: Tirar cebola, ovo, etc."
          className="bg-[#0a1929] border-[#1e4976] text-white placeholder:text-slate-500 min-h-[100px] resize-y focus:ring-0 focus:ring-offset-0 focus:border-[#1e4976] focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Footer with quantity controls and save button */}
      <div className="bg-[#0d2847] p-4 border-t border-[#1e4976]">
        <div className="flex items-center gap-3">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-[#0a1929] rounded-lg px-2 py-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-medium w-6 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="p-1 bg-green-500 rounded-full text-white hover:bg-green-400 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-white py-3 px-4 rounded-lg font-bold flex items-center justify-between transition-colors"
          >
            <span>Editar pedido</span>
            <span>{formatCurrency(total)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { CartItem } from '@/types/delivery';

interface CartItemCardProps {
  item: CartItem;
  index: number;
  onEdit: (item: CartItem, index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemove: (index: number) => void;
}

export const CartItemCard = ({
  item,
  index,
  onEdit,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) => {
  const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
  const itemPrice = (item.product.price + extrasTotal) * item.quantity;

  return (
    <div className="flex items-start gap-3">
      {/* Image - Clickable to edit */}
      {item.product.image && (
        <button 
          onClick={() => onEdit(item, index)}
          className="shrink-0"
        >
          <img 
            src={item.product.image} 
            alt={item.product.name}
            className="w-14 h-14 rounded-lg object-cover"
          />
        </button>
      )}
      
      {/* Details */}
      <div className="flex-1 min-w-0">
        <button 
          onClick={() => onEdit(item, index)}
          className="text-left w-full"
        >
          <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
          {item.extras && item.extras.length > 0 && (
            <p className="text-xs text-gray-500 truncate">
              {item.extras.map(e => e.optionName).join(', ')}
            </p>
          )}
          {item.notes && (
            <p className="text-xs text-gray-500 truncate">Obs: {item.notes}</p>
          )}
        </button>
        
        {/* Price and Quantity Controls */}
        <div className="flex items-center justify-between mt-2">
          <span className="font-semibold text-gray-900">{formatCurrency(itemPrice)}</span>
          
          <div className="flex items-center gap-2">
            {item.quantity === 1 ? (
              <button 
                onClick={() => onRemove(index)}
                className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
            )}
            <span className="w-5 text-center font-medium text-gray-900">{item.quantity}</span>
            <button 
              onClick={() => onUpdateQuantity(index, item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

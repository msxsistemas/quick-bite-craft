import { Minus, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { CartItem } from '@/types/delivery';
import { PublicRestaurant } from '@/hooks/usePublicMenu';

interface OrderReviewSectionProps {
  restaurant: PublicRestaurant | null;
  items: CartItem[];
  onAddMoreItems: () => void;
  onEditItem: (item: CartItem, index: number) => void;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
}

export const OrderReviewSection: React.FC<OrderReviewSectionProps> = ({
  restaurant,
  items,
  onAddMoreItems,
  onEditItem,
  onUpdateQuantity,
  onRemoveItem,
}) => {
  return (
    <div className="max-w-lg mx-auto w-full">
      {/* Restaurant Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        {restaurant?.logo && (
          <img 
            src={restaurant.logo} 
            alt={restaurant.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-bold text-gray-900">{restaurant?.name}</p>
          <button 
            onClick={onAddMoreItems}
            className="text-primary text-sm font-medium"
          >
            Adicionar mais itens
          </button>
        </div>
      </div>

      {/* Cart Items Section */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-3">Itens do pedido</h3>
        <div className="space-y-3">
          {items.map((item, index) => {
            const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
            const itemPrice = (item.product.price + extrasTotal) * item.quantity;
            
            return (
              <div key={index} className="flex items-start gap-3">
                {/* Image with Edit overlay */}
                {item.product.image && (
                  <button 
                    onClick={() => onEditItem(item, index)}
                    className="shrink-0 relative overflow-hidden rounded-lg"
                  >
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-14 h-14 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5">
                      <span className="text-white text-[10px] font-medium block text-center">Editar</span>
                    </div>
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  {/* Product Name - Clickable to edit */}
                  <button 
                    onClick={() => onEditItem(item, index)}
                    className="font-medium text-gray-900 text-left block"
                  >
                    {item.product.name}
                  </button>
                  
                  {/* Extras */}
                  {item.extras && item.extras.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.extras.map(e => `${e.quantity && e.quantity > 1 ? `${e.quantity}x ` : ''}${e.optionName}`).join(', ')}
                    </p>
                  )}
                  
                  {/* Notes */}
                  {item.notes && (
                    <p className="text-xs text-gray-400 italic">Obs: {item.notes}</p>
                  )}
                  
                  {/* Price and Quantity Controls */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-gray-900">{formatCurrency(itemPrice)}</span>
                    <div className="flex items-center gap-3">
                      
                      <button
                        onClick={() => {
                          if (item.quantity === 1) {
                            onRemoveItem(index);
                          } else {
                            onUpdateQuantity(index, item.quantity - 1);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-4 h-4 text-red-500" />
                        ) : (
                          <Minus className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <span className="font-medium text-gray-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

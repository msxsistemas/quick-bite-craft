import { Plus } from 'lucide-react';
import { Product } from '@/types/delivery';
import { formatCurrency } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  return (
    <div className="delivery-card flex gap-3 p-3">
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <h4 className="font-semibold text-foreground text-sm line-clamp-1">
          {product.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 flex-1">
          {product.description}
        </p>
        <p className="text-primary font-bold text-sm mt-2">
          {formatCurrency(product.price)}
        </p>
      </div>

      {/* Add Button */}
      <button
        onClick={handleAddToCart}
        className="self-end flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all duration-200 shadow-delivery"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

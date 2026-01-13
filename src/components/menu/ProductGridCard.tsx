import { Plus } from 'lucide-react';
import { PublicProduct } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';

interface ProductGridCardProps {
  product: PublicProduct;
  onProductClick: (product: PublicProduct) => void;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({ product, onProductClick }) => {
  return (
    <div 
      className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={() => onProductClick(product)}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h4 className="font-semibold text-foreground text-sm line-clamp-1">
          {product.name}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">
          {product.description || ''}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-primary font-bold text-sm">
            {formatCurrency(product.price)}
          </span>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product);
            }}
            className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full hover:bg-primary/90 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

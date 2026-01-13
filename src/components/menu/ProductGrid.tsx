import { Product, Category } from '@/types/delivery';
import { ProductGridCard } from './ProductGridCard';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string;
  onProductClick: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  categories,
  selectedCategory,
  onProductClick,
}) => {
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.categoryId === selectedCategory);

  const selectedCategoryName = selectedCategory === 'all' 
    ? 'Todos os Produtos' 
    : categories.find(c => c.id === selectedCategory)?.name || 'Produtos';

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4">{selectedCategoryName}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductGridCard 
            key={product.id} 
            product={product} 
            onProductClick={onProductClick}
          />
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum produto encontrado</p>
        </div>
      )}
    </div>
  );
};

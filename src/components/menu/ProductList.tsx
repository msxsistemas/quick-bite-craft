import { Package } from 'lucide-react';
import { PublicProduct, PublicCategory } from '@/hooks/usePublicMenu';
import { ProductCard } from './ProductCard';

interface ProductListProps {
  products: PublicProduct[];
  categories: PublicCategory[];
  selectedCategory: string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  categories,
  selectedCategory,
}) => {
  const selectedCategoryData = categories.find(c => c.id === selectedCategory);
  
  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategoryData?.name);

  const groupedProducts = categories
    .map(category => ({
      category,
      products: filteredProducts.filter(p => p.category === category.name),
    }))
    .filter(group => group.products.length > 0);

  const totalItems = filteredProducts.length;

  return (
    <div className="px-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-foreground">Cardápio</h2>
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Product Groups */}
      <div className="space-y-6">
        {groupedProducts.map(({ category, products }) => (
          <div key={category.id}>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-lg">{category.emoji}</span>
              {category.name}
            </h3>
            <div className="space-y-3">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
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

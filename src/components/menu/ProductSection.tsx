import { PublicProduct, PublicCategory } from '@/hooks/usePublicMenu';
import { ProductListItem } from './ProductListItem';

interface ProductSectionProps {
  products: PublicProduct[];
  categories: PublicCategory[];
  selectedCategory: string;
  onProductClick: (product: PublicProduct) => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  categories,
  selectedCategory,
  onProductClick,
}) => {
  // Group products by category - always show all categories (iFood style)
  const groupedProducts = categories
    .filter(c => c.id !== 'all')
    .map(category => ({
      category,
      products: products.filter(p => p.category === category.name),
    }))
    .filter(group => group.products.length > 0);

  if (products.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-muted-foreground">Nenhum produto disponível</p>
      </div>
    );
  }

  return (
    <div className="px-4 pb-4">
      {groupedProducts.map((group, groupIndex) => (
        <div key={group.category.id} className="mb-2" id={`category-${group.category.id}`}>
          {/* Category Header - iFood style */}
          <h2 className="text-lg font-bold text-foreground pt-6 pb-3 border-b border-border">
            {group.category.name}
          </h2>

          {/* Product List */}
          <div>
            {group.products.map((product, index) => (
              <ProductListItem
                key={product.id}
                product={product}
                onProductClick={onProductClick}
                showPopularBadge={groupIndex === 0 && index === 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

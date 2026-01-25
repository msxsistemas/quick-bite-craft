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
    <div className="px-4 pb-32">
      {groupedProducts.map((group, groupIndex) => (
        <div key={group.category.id} className="mb-6" id={`category-${group.category.id}`}>
          {/* Category Header */}
          <h2 className="text-xl font-bold text-foreground py-4 sticky top-12 bg-background z-10 border-b border-border">
            {group.category.emoji && <span className="mr-2">{group.category.emoji}</span>}
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

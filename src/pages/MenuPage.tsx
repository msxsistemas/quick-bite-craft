import { useState } from 'react';
import { CategoryScroller } from '@/components/menu/CategoryScroller';
import { ProductGrid } from '@/components/menu/ProductGrid';
import { FloatingCart } from '@/components/menu/FloatingCart';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { ProductDetailSheet } from '@/components/menu/ProductDetailSheet';
import { mockRestaurant, mockCategories, mockProducts } from '@/data/mockData';
import { Product } from '@/types/delivery';

const MenuPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductSheetOpen(true);
  };

  const handleCloseProductSheet = () => {
    setIsProductSheetOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <MenuHeader restaurant={mockRestaurant} />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <CategoryScroller
          categories={mockCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32">
        <ProductGrid
          products={filteredProducts}
          categories={mockCategories}
          selectedCategory={selectedCategory}
          onProductClick={handleProductClick}
        />
      </div>

      {/* Floating Cart */}
      <FloatingCart />

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        isOpen={isProductSheetOpen}
        onClose={handleCloseProductSheet}
      />
    </div>
  );
};

export default MenuPage;

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { CategoryScroller } from '@/components/menu/CategoryScroller';
import { ProductGrid } from '@/components/menu/ProductGrid';
import { FloatingCart } from '@/components/menu/FloatingCart';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { mockRestaurant, mockCategories, mockProducts } from '@/data/mockData';

const MenuPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        />
      </div>

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  );
};

export default MenuPage;

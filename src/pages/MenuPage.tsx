import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { RestaurantHeader } from '@/components/menu/RestaurantHeader';
import { SearchBar } from '@/components/menu/SearchBar';
import { CategoryScroller } from '@/components/menu/CategoryScroller';
import { ProductList } from '@/components/menu/ProductList';
import { FloatingCart } from '@/components/menu/FloatingCart';
import { mockRestaurant, mockCategories, mockProducts } from '@/data/mockData';

const MenuPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = mockProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background max-w-2xl mx-auto relative">
      {/* Cart Icon in Header */}
      <button className="fixed top-4 right-4 z-30 w-10 h-10 bg-card rounded-full shadow-card flex items-center justify-center">
        <ShoppingCart className="w-5 h-5 text-foreground" />
      </button>

      {/* Restaurant Header */}
      <RestaurantHeader restaurant={mockRestaurant} />

      {/* Search */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Categories */}
      <CategoryScroller
        categories={mockCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Products */}
      <ProductList
        products={filteredProducts}
        categories={mockCategories}
        selectedCategory={selectedCategory}
      />

      {/* Floating Cart */}
      <FloatingCart />
    </div>
  );
};

export default MenuPage;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { CategoryTabs } from '@/components/menu/CategoryTabs';
import { ProductSection } from '@/components/menu/ProductSection';
import { HighlightsCarousel } from '@/components/menu/HighlightsCarousel';
import { FloatingCart } from '@/components/menu/FloatingCart';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { RestaurantHeader } from '@/components/menu/RestaurantHeader';
import { SearchBar } from '@/components/menu/SearchBar';
import { ProductDetailSheet } from '@/components/menu/ProductDetailSheet';
import { usePublicMenu, PublicProduct } from '@/hooks/usePublicMenu';
import { usePublicOperatingHours } from '@/hooks/usePublicOperatingHours';
import { Loader2, Clock, Search } from 'lucide-react';
import { ProductListItem } from '@/components/menu/ProductListItem';

const MenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, categories, products, extraGroups, isLoading, error } = usePublicMenu(slug);
  const { getNextOpeningInfo, isLoading: hoursLoading } = usePublicOperatingHours(restaurant?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCategoryTabs, setShowCategoryTabs] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const restaurantHeaderRef = useRef<HTMLDivElement>(null);

  // Initialize selected category to first one and sync with scroll
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  // Sync selected category with scroll (iFood style)
  useEffect(() => {
    const handleScroll = () => {
      if (restaurantHeaderRef.current) {
        const headerBottom = restaurantHeaderRef.current.getBoundingClientRect().bottom;
        setShowCategoryTabs(headerBottom < 60);
      }

      // Sync selected category with visible section (iFood style)
      const categoryElements = categories
        .filter(cat => cat.id !== 'all')
        .map(cat => ({
          id: cat.id,
          element: document.getElementById(`category-${cat.id}`)
        }))
        .filter(item => item.element);

      if (categoryElements.length === 0) return;

      const offset = 180; // Account for sticky headers
      let currentCategory = categoryElements[0].id; // Default to first category

      for (const { id, element } of categoryElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the section is visible in the viewport
          if (rect.top <= offset) {
            currentCategory = id;
          }
        }
      }

      // Only update if different to avoid unnecessary re-renders
      setSelectedCategory(prev => prev !== currentCategory ? currentCategory : prev);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Filtered products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleProductClick = (product: PublicProduct) => {
    setSelectedProduct(product);
    setIsProductSheetOpen(true);
  };

  const handleCloseProductSheet = () => {
    setIsProductSheetOpen(false);
    setSelectedProduct(null);
  };

  // Handle category change and scroll to section
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const offset = 120; // Account for sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleSearchButtonClick = () => {
    // Focus the search input and scroll to it
    searchInputRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Restaurante não encontrado</h1>
          <p className="text-muted-foreground">{error || 'O restaurante não existe.'}</p>
        </div>
      </div>
    );
  }

  const isRestaurantClosed = !restaurant.is_open;
  const nextOpening = getNextOpeningInfo();

  // Create category list (no "all" option - iFood style)
  const allCategories = categories;

  return (
    <div className="min-h-screen bg-background">
      {/* Closed Restaurant Banner */}
      {isRestaurantClosed && (
        <div className="bg-destructive text-destructive-foreground text-center py-3 px-4 font-medium sticky top-0 z-50">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span>🔒 Restaurante fechado no momento</span>
            {!hoursLoading && nextOpening && (
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded text-sm">
                <Clock className="w-3.5 h-3.5" />
                Abre {nextOpening.dayName} às {nextOpening.time}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Restaurant Header with Banner */}
      <div ref={restaurantHeaderRef}>
        <RestaurantHeader restaurant={restaurant} onSearchClick={handleSearchButtonClick} />
      </div>

      {/* Search Bar */}
      <div className="sticky top-0 bg-background z-40 border-b border-border">
        <div className="px-4 py-3">
          <div 
            className="flex items-center gap-2 bg-muted rounded-full px-4 py-2.5 cursor-text"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Buscar em ${restaurant.name}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
        
        {/* Category Tabs - only show when scrolled */}
        <div 
          className={`transition-all duration-300 ease-out ${
            showCategoryTabs 
              ? 'opacity-100 translate-y-0 max-h-20' 
              : 'opacity-0 -translate-y-2 max-h-0 overflow-hidden'
          }`}
        >
          <CategoryTabs
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />
        </div>
      </div>

      {/* Search Results or Main Content */}
      {searchQuery.trim() ? (
        <div className="px-4 pb-32">
          <p className="text-sm text-muted-foreground py-4">
            {filteredProducts.length} resultado(s) para "{searchQuery}"
          </p>
          {filteredProducts.map((product) => (
            <ProductListItem
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Highlights Carousel */}
          <HighlightsCarousel 
            products={products} 
            onProductClick={handleProductClick} 
          />

          {/* Products by Category */}
          <ProductSection
            products={products}
            categories={allCategories}
            selectedCategory={selectedCategory}
            onProductClick={handleProductClick}
          />
        </>
      )}

      {/* Floating Cart - only show when restaurant is open */}
      {!isRestaurantClosed && <FloatingCart />}

      {/* Product Detail Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        extraGroups={extraGroups}
        isOpen={isProductSheetOpen}
        onClose={handleCloseProductSheet}
        disabled={isRestaurantClosed}
      />
    </div>
  );
};

export default MenuPage;

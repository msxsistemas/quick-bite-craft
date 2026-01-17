import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CategoryScroller } from '@/components/menu/CategoryScroller';
import { ProductGrid } from '@/components/menu/ProductGrid';
import { FloatingCart } from '@/components/menu/FloatingCart';
import { MenuHeader } from '@/components/menu/MenuHeader';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { ProductDetailSheet } from '@/components/menu/ProductDetailSheet';
import { usePublicMenu, PublicProduct } from '@/hooks/usePublicMenu';
import { usePublicOperatingHours } from '@/hooks/usePublicOperatingHours';
import { Loader2, Clock } from 'lucide-react';

const MenuPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, categories, products, extraGroups, isLoading, error } = usePublicMenu(slug);
  const { getNextOpeningInfo, isLoading: hoursLoading } = usePublicOperatingHours(restaurant?.id);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<PublicProduct | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductClick = (product: PublicProduct) => {
    setSelectedProduct(product);
    setIsProductSheetOpen(true);
  };

  const handleCloseProductSheet = () => {
    setIsProductSheetOpen(false);
    setSelectedProduct(null);
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

  // Create category list with "All" option
  const allCategories = [
    { id: 'all', name: 'Todos', emoji: '🍽️', image_url: null, sort_order: -1 },
    ...categories,
  ];

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

      {/* Fixed Header */}
      <MenuHeader restaurant={restaurant} />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <CategoryScroller
          categories={allCategories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-32">
        <ProductGrid
          products={filteredProducts}
          categories={allCategories}
          selectedCategory={selectedCategory}
          onProductClick={handleProductClick}
          disabled={isRestaurantClosed}
        />
      </div>

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

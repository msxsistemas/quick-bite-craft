import { useState, useMemo, useCallback, useEffect } from 'react';
import { ArrowLeft, Search, Utensils, Percent, Clock, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useWaiterSettingsContext } from '@/contexts/WaiterSettingsContext';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
  description?: string | null;
  active?: boolean;
  is_promo?: boolean;
  promo_price?: number | null;
  promo_expires_at?: string | null;
}

// Inline Promo Countdown Component
const PromoTimer = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirou');
        return;
      }

      setIsUrgent(diff < 24 * 60 * 60 * 1000);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, isUrgent ? 1000 : 60000);
    return () => clearInterval(interval);
  }, [expiresAt, isUrgent]);

  return (
    <span className={`flex items-center gap-0.5 text-[10px] ${
      isExpired ? 'text-red-400' : isUrgent ? 'text-orange-400 animate-pulse' : 'text-orange-400'
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {timeLeft}
    </span>
  );
};

interface Category {
  id: string;
  name: string;
  emoji?: string | null;
  active: boolean;
}

interface WaiterProductsViewProps {
  tableName: string;
  products: Product[];
  categories: Category[];
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  cartItemsCount?: number;
  onCartClick?: () => void;
}

export const WaiterProductsView = ({
  tableName,
  products,
  categories,
  onBack,
  onSelectProduct,
  cartItemsCount = 0,
  onCartClick,
}: WaiterProductsViewProps) => {
  const { showPhotos, showDescriptions, showSoldOut, showPrices, navigateByCategories } = useWaiterSettingsContext();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewMode, setViewMode] = useState<'categories' | 'items'>(navigateByCategories ? 'categories' : 'items');

  const activeCategories = useMemo(() => categories.filter((c) => c.active), [categories]);

  // Filter products based on active status (sold out)
  const availableProducts = useMemo(
    () => (showSoldOut ? products : products.filter((p) => p.active !== false)),
    [products, showSoldOut]
  );

  const isProductInCategory = useCallback(
    (product: Product, category: Category) => product.category === category.id || product.category === category.name,
    []
  );

  // Default to showing all products (null = "Todos")
  const currentCategory = selectedCategory;

  const selectedCategoryObj = useMemo(
    () => activeCategories.find((c) => c.id === currentCategory) ?? null,
    [activeCategories, currentCategory]
  );

  // Group all products by category for the delivery/takeout view
  const allProductsByCategory = useMemo(() => {
    const grouped: Record<string, { categoryName: string; products: Product[] }> = {};

    activeCategories.forEach((cat) => {
      const catProducts = availableProducts.filter((p) => isProductInCategory(p, cat));
      if (catProducts.length > 0) {
        grouped[cat.id] = {
          categoryName: cat.name,
          products: catProducts,
        };
      }
    });

    // Add uncategorized products
    const uncategorized = availableProducts.filter(
      (p) => !p.category || !activeCategories.some((c) => isProductInCategory(p, c))
    );
    if (uncategorized.length > 0) {
      grouped['outros'] = {
        categoryName: 'Outros',
        products: uncategorized,
      };
    }

    return grouped;
  }, [availableProducts, activeCategories, isProductInCategory]);

  // Get promotional products
  const promoProducts = useMemo(() => {
    return availableProducts.filter(p => p.is_promo && p.promo_price !== null && p.promo_price !== undefined);
  }, [availableProducts]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchesCategory = !selectedCategoryObj || isProductInCategory(p, selectedCategoryObj);
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [availableProducts, isProductInCategory, searchQuery, selectedCategoryObj]);

  // Group products by category
  const productsByCategory = useMemo(() => {
    return filteredProducts.reduce((acc, product) => {
      const cat = categories.find((c) => product.category === c.id || product.category === c.name);
      const catName = cat?.name || 'Outros';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [categories, filteredProducts]);

  // Helper to calculate discount percentage
  const getDiscountPercent = (originalPrice: number, promoPrice: number) => {
    return Math.round(((originalPrice - promoPrice) / originalPrice) * 100);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setViewMode('items');
  };

  const handleBackFromItems = () => {
    if (navigateByCategories && viewMode === 'items' && selectedCategory) {
      setSelectedCategory(null);
      setViewMode('categories');
    } else {
      onBack();
    }
  };
  
  // Check if this is delivery/takeout mode (tableName is "Delivery" or "Para levar")
  const isDeliveryMode = tableName === 'Delivery' || tableName === 'Para levar';

  // Delivery/Para Levar View - with category tabs
  if (isDeliveryMode) {
    return (
      <div className="min-h-screen bg-[#0d2847] flex flex-col">
        {/* Header */}
        <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 flex items-center justify-between sticky top-0 z-20 h-14">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold text-lg">{tableName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
            {cartItemsCount > 0 && onCartClick && (
              <button 
                onClick={onCartClick}
                className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors relative"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-xs font-bold flex items-center justify-center">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide bg-[#0d2847] border-b border-[#1e4976]">
          {/* "Todos" tab to show all products */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors border-b-2 ${
              currentCategory === null
                ? 'border-cyan-500 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors border-b-2 ${
                currentCategory === cat.id
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products List grouped by category */}
        <div className="flex-1 overflow-y-auto">
          {/* Promotional Products Section */}
          {promoProducts.length > 0 && !currentCategory && (
            <div>
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex items-center gap-2">
                <Percent className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">Promoções</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs text-white">{promoProducts.length}</span>
              </div>
              {promoProducts.map((product) => {
                const isSoldOut = product.active === false;
                const discountPercent = getDiscountPercent(product.price, product.promo_price!);
                
                return (
                  <button
                    key={`promo-${product.id}`}
                    onClick={() => !isSoldOut && onSelectProduct(product)}
                    disabled={isSoldOut}
                    className={`w-full px-4 py-3.5 flex items-center gap-4 border-b border-[#1e4976]/30 transition-colors ${
                      isSoldOut 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[#1e3a5f]/50 active:bg-[#1e3a5f]'
                    }`}
                  >
                    {showPhotos && (
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${
                          isSoldOut ? 'bg-gray-600' : 'bg-[#1e4976]'
                        }`}>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt="" 
                              className={`w-full h-full object-cover rounded-lg ${isSoldOut ? 'grayscale' : ''}`} 
                            />
                          ) : (
                            <Utensils className={`w-5 h-5 ${isSoldOut ? 'text-gray-400' : 'text-cyan-400'}`} />
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                          -{discountPercent}%
                        </div>
                      </div>
                    )}
                    
                    <span className="text-white font-medium text-sm text-left flex-1">{product.name}</span>
                    
                    {showPrices && (
                      <div className="flex flex-col items-end">
                        <span className="text-slate-400 text-xs line-through">{formatCurrency(product.price)}</span>
                        <span className="text-green-400 font-bold text-sm whitespace-nowrap">{formatCurrency(product.promo_price!)}</span>
                        {product.promo_expires_at && <PromoTimer expiresAt={product.promo_expires_at} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {Object.entries(allProductsByCategory)
            .filter(([catId]) => !currentCategory || catId === currentCategory)
            .map(([catId, { categoryName, products: catProducts }]) => (
            <div key={catId}>
              {/* Category Header */}
              <div className="bg-[#081c36] px-4 py-2.5 border-y border-[#1e4976]/70">
                <span className="text-white font-semibold text-sm">{categoryName}</span>
              </div>

              {/* Products */}
              {catProducts.map((product) => {
                const isSoldOut = product.active === false;
                const isPromo = product.is_promo && product.promo_price !== null && product.promo_price !== undefined;
                const discountPercent = isPromo ? getDiscountPercent(product.price, product.promo_price!) : 0;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => !isSoldOut && onSelectProduct(product)}
                    disabled={isSoldOut}
                    className={`w-full px-4 py-3.5 flex items-center gap-4 border-b border-[#1e4976]/30 transition-colors ${
                      isSoldOut 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[#1e3a5f]/50 active:bg-[#1e3a5f]'
                    }`}
                  >
                    {/* Product Image */}
                    {showPhotos && (
                      <div className="relative">
                        <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${
                          isSoldOut ? 'bg-gray-600' : 'bg-[#1e4976]'
                        }`}>
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt="" 
                              className={`w-full h-full object-cover rounded-lg ${isSoldOut ? 'grayscale' : ''}`} 
                            />
                          ) : (
                            <Utensils className={`w-5 h-5 ${isSoldOut ? 'text-gray-400' : 'text-cyan-400'}`} />
                          )}
                        </div>
                        {isPromo && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                            -{discountPercent}%
                          </div>
                        )}
                      </div>
                    )}
                    
                    <span className="text-white font-medium text-sm text-left flex-1">{product.name}</span>
                    
                    {showPrices && (
                      isPromo ? (
                        <div className="flex flex-col items-end">
                          <span className="text-red-400/80 text-xs line-through">{formatCurrency(product.price)}</span>
                          <span className="text-emerald-400 font-bold text-sm whitespace-nowrap">{formatCurrency(product.promo_price!)}</span>
                          {product.promo_expires_at && <PromoTimer expiresAt={product.promo_expires_at} />}
                        </div>
                      ) : (
                        <span className="text-white font-bold text-sm whitespace-nowrap">{formatCurrency(product.price)}</span>
                      )
                    )}
                  </button>
                );
              })}
            </div>
          ))}
          
          {Object.keys(allProductsByCategory).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Utensils className="w-12 h-12 text-slate-500 mb-3" />
              <p className="text-slate-400">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Categories Grid View
  if (viewMode === 'categories' && navigateByCategories && !searchQuery) {
    return (
      <div className="min-h-screen bg-[#0d2847] flex flex-col">
        {/* Header */}
        <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 flex items-center justify-between sticky top-0 z-20 h-14">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold text-lg">{tableName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors"
            >
              <Search className="w-6 h-6" />
            </button>
            {cartItemsCount > 0 && onCartClick && (
              <button 
                onClick={onCartClick}
                className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors relative"
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-xs font-bold flex items-center justify-center">
                  {cartItemsCount > 9 ? '9+' : cartItemsCount}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* Search Input */}
        {showSearch && (
          <div className="p-4 bg-[#0d2847] border-b border-[#1e4976]">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) setViewMode('items');
              }}
              className="w-full px-4 py-2 bg-[#1e3a5f] border border-[#1e4976] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {/* Categories Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3">
            {activeCategories.map((cat) => {
              const categoryProducts = availableProducts.filter((p) => isProductInCategory(p, cat));
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className="bg-[#0d2847] border border-[#1e4976] rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-cyan-500 transition-colors min-h-[100px]"
                >
                  {cat.emoji && <span className="text-2xl">{cat.emoji}</span>}
                  <span className="text-white font-medium text-center text-sm">{cat.name}</span>
                  <span className="text-slate-400 text-xs">{categoryProducts.length} itens</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Items List View
  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 flex items-center justify-between sticky top-0 z-20 h-14">
        <div className="flex items-center gap-3">
          <button onClick={handleBackFromItems} className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold text-lg">
            {navigateByCategories && selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || tableName
              : tableName
            }
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
          {cartItemsCount > 0 && onCartClick && (
            <button 
              onClick={onCartClick}
              className="p-1.5 text-white hover:bg-[#1e4976] rounded transition-colors relative"
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-cyan-500 rounded-full text-xs font-bold flex items-center justify-center">
                {cartItemsCount > 9 ? '9+' : cartItemsCount}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Search Input */}
      {showSearch && (
        <div className="p-4 bg-[#0d2847] border-b border-[#1e4976]">
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#1e3a5f] border border-[#1e4976] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Category Tabs (only show when not in category navigation mode) */}
      {!navigateByCategories && (
        <div className="flex overflow-x-auto scrollbar-hide bg-[#0d2847] border-b border-[#1e4976]">
          {/* "Todos" tab to show all products */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors ${
              currentCategory === null
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos
          </button>
          {activeCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-3 whitespace-nowrap text-sm font-medium transition-colors ${
                currentCategory === cat.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Products List */}
      <div className="flex-1 overflow-y-auto">
        {/* Promotional Products Section */}
        {promoProducts.length > 0 && !navigateByCategories && !currentCategory && (
          <div>
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex items-center gap-2">
              <Percent className="w-4 h-4 text-white" />
              <span className="text-white font-semibold">Promoções</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs text-white">{promoProducts.length}</span>
            </div>
            {promoProducts.map((product) => {
              const isSoldOut = product.active === false;
              const discountPercent = getDiscountPercent(product.price, product.promo_price!);
              
              return (
                <button
                  key={`promo-list-${product.id}`}
                  onClick={() => !isSoldOut && onSelectProduct(product)}
                  disabled={isSoldOut}
                  className={`w-full px-4 py-3.5 flex items-center gap-4 border-b border-[#1e4976]/30 transition-colors ${
                    isSoldOut 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-[#1e3a5f]/50 active:bg-[#1e3a5f]'
                  }`}
                >
                  {showPhotos && (
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        isSoldOut ? 'bg-gray-600' : 'bg-[#1e4976]'
                      }`}>
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt="" 
                            className={`w-full h-full object-cover rounded-lg ${isSoldOut ? 'grayscale' : ''}`} 
                          />
                        ) : (
                          <Utensils className={`w-5 h-5 ${isSoldOut ? 'text-gray-400' : 'text-cyan-400'}`} />
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                        -{discountPercent}%
                      </div>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-white font-medium block truncate">{product.name}</span>
                    {showDescriptions && product.description && (
                      <span className="text-slate-400 text-xs block truncate mt-0.5">
                        {product.description}
                      </span>
                    )}
                  </div>
                  
                  {showPrices && (
                    <div className="flex flex-col items-end">
                      <span className="text-slate-400 text-xs line-through">{formatCurrency(product.price)}</span>
                      <span className="text-green-400 font-bold whitespace-nowrap">{formatCurrency(product.promo_price!)}</span>
                      {product.promo_expires_at && <PromoTimer expiresAt={product.promo_expires_at} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
          <div key={categoryName}>
            {/* Category Header (only show when not in category navigation mode) */}
            {!navigateByCategories && (
              <div className="bg-[#081c36] px-4 py-2.5 border-y border-[#1e4976]/70">
                <span className="text-white font-semibold">{categoryName}</span>
              </div>
            )}

            {/* Products */}
            {categoryProducts.map((product) => {
              const isSoldOut = product.active === false;
              const isPromo = product.is_promo && product.promo_price !== null && product.promo_price !== undefined;
              const discountPercent = isPromo ? getDiscountPercent(product.price, product.promo_price!) : 0;
              
              return (
                <button
                  key={product.id}
                  onClick={() => !isSoldOut && onSelectProduct(product)}
                  disabled={isSoldOut}
                  className={`w-full px-4 py-3.5 flex items-center gap-4 border-b border-[#1e4976]/30 transition-colors ${
                    isSoldOut 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-[#1e3a5f]/50 active:bg-[#1e3a5f]'
                  }`}
                >
                  {/* Product Image - conditionally rendered */}
                  {showPhotos && (
                    <div className="relative">
                      <div className={`w-11 h-11 rounded-lg flex-shrink-0 flex items-center justify-center ${
                        isSoldOut ? 'bg-gray-600' : 'bg-[#1e4976]'
                      }`}>
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt="" 
                            className={`w-full h-full object-cover rounded-lg ${isSoldOut ? 'grayscale' : ''}`} 
                          />
                        ) : (
                          <Utensils className={`w-5 h-5 ${isSoldOut ? 'text-gray-400' : 'text-cyan-400'}`} />
                        )}
                      </div>
                      {isPromo && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded">
                          -{discountPercent}%
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0 text-left">
                    <span className="text-white font-medium block truncate">{product.name}</span>
                    
                    {/* Description - conditionally rendered */}
                    {showDescriptions && product.description && (
                      <span className="text-slate-400 text-xs block truncate mt-0.5">
                        {product.description}
                      </span>
                    )}
                    
                    {/* Sold out indicator */}
                    {isSoldOut && (
                      <span className="text-red-400 text-xs font-medium">Esgotado</span>
                    )}
                  </div>
                  
                  {showPrices && (
                    isPromo ? (
                      <div className="flex flex-col items-end">
                        <span className="text-red-400/80 text-xs line-through">{formatCurrency(product.price)}</span>
                        <span className="text-emerald-400 font-bold whitespace-nowrap">{formatCurrency(product.promo_price!)}</span>
                        {product.promo_expires_at && <PromoTimer expiresAt={product.promo_expires_at} />}
                      </div>
                    ) : (
                      <span className="text-white font-bold whitespace-nowrap">{formatCurrency(product.price)}</span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        ))}
        
        {Object.keys(productsByCategory).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Utensils className="w-12 h-12 text-slate-500 mb-3" />
            <p className="text-slate-400">Nenhum produto encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
};

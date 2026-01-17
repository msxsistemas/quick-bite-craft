import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Utensils } from 'lucide-react';
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
}

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
}

export const WaiterProductsView = ({
  tableName,
  products,
  categories,
  onBack,
  onSelectProduct,
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
        <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold">{tableName}</h1>
          </div>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
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
          {Object.entries(allProductsByCategory)
            .filter(([catId]) => !currentCategory || catId === currentCategory)
            .map(([catId, { categoryName, products: catProducts }]) => (
            <div key={catId}>
              {/* Category Header */}
              <div className="bg-[#0d2847] px-4 py-2.5 flex items-center justify-between border-b border-[#1e4976]/50">
                <span className="text-white font-semibold text-sm">{categoryName}</span>
                <span className="text-cyan-400 text-xs font-medium tracking-wide">PROMOÇÃO</span>
              </div>

              {/* Products */}
              {catProducts.map((product) => {
                const isSoldOut = product.active === false;
                
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
                    )}
                    
                    <span className="text-white font-medium text-sm text-left flex-1">{product.name}</span>
                    
                    {showPrices && (
                      <span className="text-cyan-400 font-bold text-sm whitespace-nowrap">{formatCurrency(product.price)}</span>
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
        <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-white font-semibold">{tableName}</h1>
          </div>
          <button 
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
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
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={handleBackFromItems} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">
            {navigateByCategories && selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || tableName
              : tableName
            }
          </h1>
        </div>
        <button 
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <Search className="w-6 h-6" />
        </button>
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
        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
          <div key={categoryName}>
            {/* Category Header (only show when not in category navigation mode) */}
            {!navigateByCategories && (
              <div className="bg-[#0d2847] px-4 py-2.5 flex items-center justify-between border-b border-[#1e4976]/50">
                <span className="text-white font-semibold">{categoryName}</span>
                <span className="text-cyan-400 text-xs font-medium tracking-wide">PROMOÇÃO</span>
              </div>
            )}

            {/* Products */}
            {categoryProducts.map((product) => {
              const isSoldOut = product.active === false;
              
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
                    <span className="text-cyan-400 font-bold whitespace-nowrap">{formatCurrency(product.price)}</span>
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

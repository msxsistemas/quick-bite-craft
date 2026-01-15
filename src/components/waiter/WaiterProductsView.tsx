import { useState } from 'react';
import { ArrowLeft, Search, Utensils } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  image_url?: string | null;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const activeCategories = categories.filter(c => c.active);
  
  // Set first category as default if none selected
  const currentCategory = selectedCategory || (activeCategories.length > 0 ? activeCategories[0].id : null);

  const filteredProducts = products.filter(p => {
    const matchesCategory = !currentCategory || p.category === currentCategory;
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const cat = categories.find(c => c.id === product.category);
    const catName = cat?.name || 'Outros';
    if (!acc[catName]) {
      acc[catName] = [];
    }
    acc[catName].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#0a1628] border border-[#1e4976] rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-[#0a1628] border-b border-[#1e4976]">
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
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
          <div key={categoryName}>
            {/* Category Header */}
            <div className="bg-[#0d2847] px-4 py-2 flex items-center justify-between">
              <span className="text-white font-medium">{categoryName}</span>
              <span className="text-amber-500 text-sm font-medium">PROMOÇÃO</span>
            </div>

            {/* Products */}
            {categoryProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="w-full px-4 py-4 flex items-center justify-between border-b border-[#1e4976]/30 hover:bg-[#0d2847]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0d2847] flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <Utensils className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <span className="text-white font-medium">{product.name}</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(product.price)}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

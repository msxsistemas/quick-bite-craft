import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Plus, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  active: boolean;
  visible: boolean;
}

const ProductsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  const [products] = useState<Product[]>([
    { id: 1, name: 'Água Mineral 500ml', category: 'Bebidas', price: 4.90, image: '', active: false, visible: true },
    { id: 2, name: 'Angus Supreme', category: 'Burgers Premium', price: 45.90, image: '', active: true, visible: false },
    { id: 3, name: 'Bacon Burger', category: 'Burgers Clássicos', price: 32.90, image: '', active: true, visible: false },
    { id: 4, name: 'Batata Frita G', category: 'Acompanhamentos', price: 22.90, image: '', active: true, visible: false },
    { id: 5, name: 'Batata Frita M', category: 'Acompanhamentos', price: 16.90, image: '', active: false, visible: true },
    { id: 6, name: 'Batata Frita P', category: 'Acompanhamentos', price: 12.90, image: '', active: true, visible: false },
    { id: 7, name: 'Blue Cheese Special', category: 'Burgers Premium', price: 48.90, image: '', active: true, visible: false },
    { id: 8, name: 'Brownie com Sorvete', category: 'Sobremesas', price: 19.90, image: '', active: true, visible: false },
    { id: 9, name: 'Cheese Burger Duplo', category: 'Burgers Clássicos', price: 34.90, image: '', active: true, visible: false },
    { id: 10, name: 'Classic Burger', category: 'Burgers Clássicos', price: 28.90, image: '', active: true, visible: false },
    { id: 11, name: 'Coca-Cola 350ml', category: 'Bebidas', price: 6.90, image: '', active: true, visible: false },
    { id: 12, name: 'Combo Classic', category: 'Combos', price: 42.90, image: '', active: true, visible: false },
    { id: 13, name: 'Combo Duplo', category: 'Combos', price: 79.90, image: '', active: true, visible: false },
    { id: 14, name: 'Combo Premium', category: 'Combos', price: 65.90, image: '', active: true, visible: false },
    { id: 15, name: 'Guaraná Antarctica 350ml', category: 'Bebidas', price: 6.90, image: '', active: true, visible: false },
  ]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍔</span>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                        product.active
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-red-100 text-red-700 border border-red-300'
                      }`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                    <p className="text-amber-600 font-semibold mt-1">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center border-t border-border">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  {product.visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      On
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Off
                    </>
                  )}
                </button>
                <div className="w-px h-8 bg-border" />
                <button className="p-3 text-muted-foreground hover:bg-muted transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="w-px h-8 bg-border" />
                <button className="p-3 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductsPage;

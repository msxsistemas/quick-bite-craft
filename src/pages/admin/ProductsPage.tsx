import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Plus, Eye, EyeOff, Pencil, Trash2, X, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  active: boolean;
  visible: boolean;
  extraGroups: number[];
}

interface ExtraGroup {
  id: number;
  name: string;
  description: string;
}

interface Category {
  id: number;
  name: string;
}

const ProductsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');
  const [selectedExtraGroups, setSelectedExtraGroups] = useState<number[]>([]);

  // Mock categories
  const categories: Category[] = [
    { id: 1, name: 'Burgers Clássicos' },
    { id: 2, name: 'Burgers Premium' },
    { id: 3, name: 'Acompanhamentos' },
    { id: 4, name: 'Bebidas' },
    { id: 5, name: 'Sobremesas' },
    { id: 6, name: 'Combos' },
  ];

  // Mock extra groups (from ExtrasPage)
  const extraGroups: ExtraGroup[] = [
    { id: 1, name: 'ponto_carne', description: 'Ponto da Carne' },
    { id: 2, name: 'adicionais', description: 'Adicionais' },
    { id: 3, name: 'molhos', description: 'Molhos Extras' },
    { id: 4, name: 'Sabores', description: 'Sabores Pizza' },
  ];

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Água Mineral 500ml', description: '', category: 'Bebidas', price: 4.90, image: '', active: false, visible: true, extraGroups: [] },
    { id: 2, name: 'Angus Supreme', description: '', category: 'Burgers Premium', price: 45.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 3, name: 'Bacon Burger', description: '', category: 'Burgers Clássicos', price: 32.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 4, name: 'Batata Frita G', description: '', category: 'Acompanhamentos', price: 22.90, image: '', active: true, visible: false, extraGroups: [] },
    { id: 5, name: 'Batata Frita M', description: '', category: 'Acompanhamentos', price: 16.90, image: '', active: false, visible: true, extraGroups: [] },
    { id: 6, name: 'Batata Frita P', description: '', category: 'Acompanhamentos', price: 12.90, image: '', active: true, visible: false, extraGroups: [] },
    { id: 7, name: 'Blue Cheese Special', description: '', category: 'Burgers Premium', price: 48.90, image: '', active: true, visible: false, extraGroups: [1, 2, 3] },
    { id: 8, name: 'Brownie com Sorvete', description: '', category: 'Sobremesas', price: 19.90, image: '', active: true, visible: false, extraGroups: [] },
    { id: 9, name: 'Cheese Burger Duplo', description: '', category: 'Burgers Clássicos', price: 34.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 10, name: 'Classic Burger', description: '', category: 'Burgers Clássicos', price: 28.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 11, name: 'Coca-Cola 350ml', description: '', category: 'Bebidas', price: 6.90, image: '', active: true, visible: false, extraGroups: [] },
    { id: 12, name: 'Combo Classic', description: '', category: 'Combos', price: 42.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 13, name: 'Combo Duplo', description: '', category: 'Combos', price: 79.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 14, name: 'Combo Premium', description: '', category: 'Combos', price: 65.90, image: '', active: true, visible: false, extraGroups: [1, 2] },
    { id: 15, name: 'Guaraná Antarctica 350ml', description: '', category: 'Bebidas', price: 6.90, image: '', active: true, visible: false, extraGroups: [] },
  ]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('');
    setFormImage('');
    setSelectedExtraGroups([]);
    setEditingProduct(null);
  };

  const openNewProductModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description);
    setFormPrice(product.price.toFixed(2).replace('.', ','));
    setFormCategory(product.category);
    setFormImage(product.image);
    setSelectedExtraGroups(product.extraGroups);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error('O nome do produto é obrigatório');
      return;
    }

    const price = parseFloat(formPrice.replace(',', '.')) || 0;

    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...p, name: formName, description: formDescription, price, category: formCategory, image: formImage, extraGroups: selectedExtraGroups }
          : p
      ));
      toast.success('Produto atualizado com sucesso!');
    } else {
      // Create new product
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        name: formName,
        description: formDescription,
        category: formCategory,
        price,
        image: formImage,
        active: true,
        visible: false,
        extraGroups: selectedExtraGroups,
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success('Produto criado com sucesso!');
    }

    handleCloseModal();
  };

  const toggleExtraGroup = (groupId: number) => {
    setSelectedExtraGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleVisibility = (productId: number) => {
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, visible: !p.visible } : p
    ));
  };

  const toggleActive = (productId: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const newActive = !p.active;
        toast.success(newActive ? 'Produto ativado!' : 'Produto desativado!');
        return { ...p, active: newActive };
      }
      return p;
    }));
  };

  const deleteProduct = (productId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Produto excluído com sucesso!');
    }
  };

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
          <button 
            onClick={openNewProductModal}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <button 
                  onClick={() => toggleVisibility(product.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
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
                <button 
                  onClick={() => openEditProductModal(product)}
                  className="p-3 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="w-px h-8 bg-border" />
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="p-3 text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Image Upload */}
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground transition-colors"
              onClick={() => {
                const url = window.prompt('Cole a URL da imagem:');
                if (url) setFormImage(url);
              }}
            >
              {formImage ? (
                <img src={formImage} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
              ) : (
                <>
                  <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para enviar imagem</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 5MB</p>
                </>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nome do produto"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descrição do produto"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Price and Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Preço *</label>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Selecione</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Extra Groups */}
            <div>
              <label className="block text-sm font-medium mb-2">Grupos de Acréscimos</label>
              <div className="space-y-2">
                {extraGroups.map(group => (
                  <label 
                    key={group.id} 
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        selectedExtraGroups.includes(group.id) 
                          ? 'border-amber-500 bg-amber-500' 
                          : 'border-muted-foreground'
                      }`}
                      onClick={() => toggleExtraGroup(group.id)}
                    >
                      {selectedExtraGroups.includes(group.id) && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className="text-sm">
                      <strong>{group.description}</strong>
                      <span className="text-muted-foreground ml-1">({group.name})</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selecione os grupos de acréscimos que aparecerão neste produto
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ProductsPage;

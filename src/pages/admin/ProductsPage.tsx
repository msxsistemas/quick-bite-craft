import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Plus, Eye, EyeOff, Pencil, Trash2, ImageIcon, GripVertical, Loader2, X, Copy, Ban, CheckCircle, Percent, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { toast } from '@/components/ui/app-toast';
import { useProducts, uploadProductImage, Product } from '@/hooks/useProducts';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useExtraGroups } from '@/hooks/useExtraGroups';
import { useCategories } from '@/hooks/useCategories';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState as useStateReact, useEffect as useEffectReact } from 'react';

// Promo Countdown Component
const PromoCountdown = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = useStateReact<string>('');
  const [isExpired, setIsExpired] = useStateReact(false);

  useEffectReact(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expirada');
        return;
      }

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
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={`flex items-center gap-1 text-xs mt-0.5 ${isExpired ? 'text-red-500' : 'text-orange-500'}`}>
      <Clock className="w-3 h-3" />
      <span>{timeLeft}</span>
    </div>
  );
};

// Sortable Product Card Component
const SortableProductCard = ({ 
  product, 
  onToggleVisibility,
  onToggleSoldOut,
  onEdit, 
  onDelete,
  onDuplicate 
}: { 
  product: Product;
  onToggleVisibility: (product: Product) => void;
  onToggleSoldOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="p-4">
        <div className="flex gap-4">
          {/* Drag Handle */}
          <button 
            {...attributes} 
            {...listeners}
            className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Product Image */}
          <div className="w-16 h-16 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">🍔</span>
            )}
          </div>
          
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                {product.is_promo && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white whitespace-nowrap">
                    PROMO
                  </span>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                product.sold_out
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : product.visible
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {product.sold_out ? 'Esgotado' : product.visible ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{product.category || 'Sem categoria'}</p>
            {product.is_promo && product.promo_price ? (
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm line-through">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-green-600 font-semibold">
                    R$ {product.promo_price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                {product.promo_expires_at && (
                  <PromoCountdown expiresAt={product.promo_expires_at} />
                )}
              </div>
            ) : (
              <p className="text-amber-600 font-semibold mt-1">
                R$ {product.price.toFixed(2).replace('.', ',')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-border">
        <button 
          onClick={() => onToggleVisibility(product)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
          title={product.visible ? 'Desativar' : 'Ativar'}
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
          onClick={() => onToggleSoldOut(product)}
          className={`p-3 transition-colors ${
            product.sold_out 
              ? 'text-orange-500 hover:bg-orange-50' 
              : 'text-muted-foreground hover:bg-muted'
          }`}
          title={product.sold_out ? 'Marcar como disponível' : 'Marcar como esgotado'}
        >
          {product.sold_out ? (
            <Ban className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
        </button>
        <div className="w-px h-8 bg-border" />
        <button 
          onClick={() => onDuplicate(product.id)}
          className="p-3 text-muted-foreground hover:bg-muted transition-colors"
          title="Duplicar"
        >
          <Copy className="w-4 h-4" />
        </button>
        <div className="w-px h-8 bg-border" />
        <button 
          onClick={() => onEdit(product)}
          className="p-3 text-muted-foreground hover:bg-muted transition-colors"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <div className="w-px h-8 bg-border" />
        <button 
          onClick={() => onDelete(product.id)}
          className="p-3 text-red-500 hover:bg-red-50 transition-colors"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant, error: restaurantError } = useRestaurantBySlug(slug);
  const { 
    products, 
    isLoading: isLoadingProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    duplicateProduct,
    toggleVisibility,
    toggleSoldOut,
    reorderProducts 
  } = useProducts(restaurant?.id);

  const { groups: extraGroups, isLoading: isLoadingExtras } = useExtraGroups(restaurant?.id);
  const { categories, loading: isLoadingCategories } = useCategories(restaurant?.id);

  const isLoading = isLoadingRestaurant || (restaurant && isLoadingProducts) || (restaurant && isLoadingExtras) || (restaurant && isLoadingCategories);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [toggleProduct, setToggleProduct] = useState<Product | null>(null);
  const [soldOutProduct, setSoldOutProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');
  const [selectedExtraGroups, setSelectedExtraGroups] = useState<string[]>([]);
  const [formIsPromo, setFormIsPromo] = useState(false);
  const [formPromoPrice, setFormPromoPrice] = useState<number | null>(null);
  const [formPromoExpiresAt, setFormPromoExpiresAt] = useState<string>('');

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesPromo = !promoFilter || p.is_promo;
    return matchesSearch && matchesCategory && matchesPromo;
  });

  // Count promo products
  const promoCount = products.filter(p => p.is_promo).length;

  // Get unique categories from products
  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice(0);
    setFormCategory('');
    setFormImage('');
    setSelectedExtraGroups([]);
    setFormIsPromo(false);
    setFormPromoPrice(null);
    setFormPromoExpiresAt('');
    setEditingProduct(null);
  };

  const openNewProductModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(product.price);
    setFormCategory(product.category || '');
    setFormImage(product.image_url || '');
    setSelectedExtraGroups(product.extra_groups || []);
    setFormIsPromo(product.is_promo || false);
    setFormPromoPrice(product.promo_price || null);
    // Convert ISO date to local datetime-local format
    setFormPromoExpiresAt(product.promo_expires_at ? new Date(product.promo_expires_at).toISOString().slice(0, 16) : '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Compress image before upload
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          
          // Scale down if larger than maxWidth
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(file);
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant?.id) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setIsUploading(true);
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      const url = await uploadProductImage(compressedFile, restaurant.id);
      if (url) {
        setFormImage(url);
        toast.success('Imagem enviada com sucesso!');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Erro ao processar imagem');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setFormImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('O nome do produto é obrigatório');
      return;
    }

    if (formPrice <= 0) {
      toast.error('O preço do produto é obrigatório e deve ser maior que zero');
      return;
    }

    // Prevent double submission (sync guard + UI state)
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;

    setIsSubmitting(true);

    try {
      const promoExpiresAtValue = formIsPromo && formPromoExpiresAt 
        ? new Date(formPromoExpiresAt).toISOString() 
        : null;

      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          image_url: formImage,
          extra_groups: selectedExtraGroups,
          is_promo: formIsPromo,
          promo_price: formIsPromo ? formPromoPrice : null,
          promo_expires_at: promoExpiresAtValue,
        });
      } else {
        await createProduct({
          name: formName,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          image_url: formImage,
          extra_groups: selectedExtraGroups,
          is_promo: formIsPromo,
          promo_price: formIsPromo ? formPromoPrice : null,
          promo_expires_at: promoExpiresAtValue,
        });
      }
      handleCloseModal();
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  const toggleExtraGroup = (groupId: string) => {
    setSelectedExtraGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleDeleteClick = (productId: string) => {
    setDeleteProductId(productId);
  };

  const handleConfirmDelete = async () => {
    if (deleteProductId) {
      await deleteProduct(deleteProductId);
      setDeleteProductId(null);
    }
  };

  const handleToggleClick = (product: Product) => {
    setToggleProduct(product);
  };

  const handleConfirmToggle = async () => {
    if (toggleProduct) {
      await toggleVisibility(toggleProduct.id);
      setToggleProduct(null);
    }
  };

  const handleSoldOutClick = (product: Product) => {
    setSoldOutProduct(product);
  };

  const handleConfirmSoldOut = async () => {
    if (soldOutProduct) {
      await toggleSoldOut(soldOutProduct.id);
      setSoldOutProduct(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderProducts(active.id as string, over.id as string);
    }
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[140px]"
          >
            <option value="">Todas categorias</option>
            {productCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button
            onClick={() => setPromoFilter(!promoFilter)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
              promoFilter 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-card text-foreground border-border hover:bg-muted'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span className="hidden sm:inline">Promoções</span>
            {promoCount > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                promoFilter ? 'bg-white/20' : 'bg-red-100 text-red-600'
              }`}>
                {promoCount}
              </span>
            )}
          </button>
          <Button onClick={openNewProductModal} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Produto
          </Button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : !restaurant ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Restaurante não encontrado no banco de dados.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Por favor, crie primeiro um restaurante antes de adicionar produtos.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum produto cadastrado ainda.</p>
            <button 
              onClick={openNewProductModal}
              className="mt-4 text-amber-500 hover:underline"
            >
              Criar primeiro produto
            </button>
          </div>
        ) : (
          /* Products Grid with DnD */
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredProducts.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <SortableProductCard
                    key={product.id}
                    product={product}
                    onToggleVisibility={handleToggleClick}
                    onToggleSoldOut={handleSoldOutClick}
                    onEdit={openEditProductModal}
                    onDelete={handleDeleteClick}
                    onDuplicate={duplicateProduct}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Side Panel Product Form */}
      {isModalOpen && (
        <>
          {/* Overlay - only on mobile */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 md:bg-transparent md:pointer-events-none"
            onClick={handleCloseModal}
          />
          
          {/* Panel */}
          <div className="fixed inset-0 md:left-64 md:right-0 md:top-0 md:bottom-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-border">
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Imagem</label>
                {formImage ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                    <img 
                      src={formImage} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-white text-foreground rounded-full hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Clique para enviar imagem</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG até 10MB (compressão automática)</p>
                      </>
                    )}
                  </div>
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
                  className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Price and Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preço *</label>
                  <CurrencyInput
                    value={formPrice}
                    onChange={setFormPrice}
                    placeholder="0,00"
                    className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecione</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Promotion Section */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <label 
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => setFormIsPromo(!formIsPromo)}
                >
                  <div 
                    className={`w-10 h-6 rounded-full transition-colors flex items-center px-1 ${
                      formIsPromo ? 'bg-destructive' : 'bg-muted'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        formIsPromo ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium">Produto em promoção</span>
                  </div>
                </label>
                
                {formIsPromo && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Preço promocional *</label>
                      <CurrencyInput
                        value={formPromoPrice || 0}
                        onChange={(value) => setFormPromoPrice(value)}
                        placeholder="0,00"
                        className="w-full px-3 py-3 border border-destructive/30 rounded-lg bg-destructive/5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                      />
                      {formPromoPrice && formPrice > 0 && formPromoPrice < formPrice && (
                        <p className="text-xs text-green-600 mt-1">
                          Desconto de {Math.round(((formPrice - formPromoPrice) / formPrice) * 100)}%
                        </p>
                      )}
                      {formPromoPrice && formPromoPrice >= formPrice && (
                        <p className="text-xs text-destructive mt-1">
                          O preço promocional deve ser menor que o preço original
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        Data de expiração (opcional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formPromoExpiresAt}
                        onChange={(e) => setFormPromoExpiresAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full px-3 py-3 border border-orange-300/50 rounded-lg bg-orange-500/5 text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Deixe em branco para promoção sem prazo
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Extra Groups */}
              <div>
                <label className="block text-sm font-medium mb-2">Grupos de Acréscimos</label>
                {extraGroups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum grupo cadastrado. Crie grupos na página de Acréscimos.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extraGroups.map(group => (
                      <label 
                        key={group.id} 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleExtraGroup(group.id)}
                      >
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedExtraGroups.includes(group.id) 
                              ? 'border-primary bg-primary' 
                              : 'border-muted-foreground'
                          }`}
                        >
                          {selectedExtraGroups.includes(group.id) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <span className="text-sm">
                          <strong>{group.display_title}</strong>
                          <span className="text-muted-foreground ml-1">({group.internal_name})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Selecione os grupos de acréscimos que aparecerão neste produto
                </p>
              </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? 'Editar produto' : 'Criar produto'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir produto?"
        description="Esta ação não pode ser desfeita. O produto será removido permanentemente."
      />

      {/* Toggle Visibility Confirmation Dialog */}
      <AlertDialog open={!!toggleProduct} onOpenChange={() => setToggleProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleProduct?.visible ? 'Desativar produto?' : 'Ativar produto?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleProduct?.visible 
                ? `O produto "${toggleProduct?.name}" ficará invisível para os clientes.`
                : `O produto "${toggleProduct?.name}" ficará visível para os clientes.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmToggle}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {toggleProduct?.visible ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Sold Out Confirmation Dialog */}
      <AlertDialog open={!!soldOutProduct} onOpenChange={() => setSoldOutProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {soldOutProduct?.sold_out ? 'Marcar como disponível?' : 'Marcar como esgotado?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {soldOutProduct?.sold_out 
                ? `O produto "${soldOutProduct?.name}" voltará a estar disponível para os clientes.`
                : `O produto "${soldOutProduct?.name}" será marcado como esgotado e os clientes não poderão adicioná-lo ao carrinho.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmSoldOut}
              className={soldOutProduct?.sold_out ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}
            >
              {soldOutProduct?.sold_out ? 'Disponibilizar' : 'Marcar esgotado'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default ProductsPage;

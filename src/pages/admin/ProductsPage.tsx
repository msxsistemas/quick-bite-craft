import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Search, Plus, Eye, EyeOff, Pencil, Trash2, ImageIcon, GripVertical, Loader2, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
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

// Sortable Product Card Component
const SortableProductCard = ({ 
  product, 
  onToggleVisibility, 
  onEdit, 
  onDelete,
  onDuplicate 
}: { 
  product: Product;
  onToggleVisibility: (product: Product) => void;
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
              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                product.visible
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {product.visible ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{product.category || 'Sem categoria'}</p>
            <p className="text-amber-600 font-semibold mt-1">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center border-t border-border">
        <button 
          onClick={() => onToggleVisibility(product)}
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
    reorderProducts 
  } = useProducts(restaurant?.id);

  const { groups: extraGroups, isLoading: isLoadingExtras } = useExtraGroups(restaurant?.id);
  const { categories, loading: isLoadingCategories } = useCategories(restaurant?.id);

  const isLoading = isLoadingRestaurant || (restaurant && isLoadingProducts) || (restaurant && isLoadingExtras) || (restaurant && isLoadingCategories);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [toggleProduct, setToggleProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formCategory, setFormCategory] = useState('');
  const [formImage, setFormImage] = useState('');
  const [selectedExtraGroups, setSelectedExtraGroups] = useState<string[]>([]);

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
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice(0);
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
    setFormDescription(product.description || '');
    setFormPrice(product.price);
    setFormCategory(product.category || '');
    setFormImage(product.image_url || '');
    setSelectedExtraGroups(product.extra_groups || []);
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
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          image_url: formImage,
          extra_groups: selectedExtraGroups,
        });
      } else {
        await createProduct({
          name: formName,
          description: formDescription,
          price: formPrice,
          category: formCategory,
          image_url: formImage,
          extra_groups: selectedExtraGroups,
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
            className="px-3 py-2 text-sm border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[160px]"
          >
            <option value="">Todas categorias</option>
            {productCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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

      {/* New/Edit Product Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
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
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
                  <img 
                    src={formImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
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
                <CurrencyInput
                  value={formPrice}
                  onChange={setFormPrice}
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
                            ? 'border-amber-500 bg-amber-500' 
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

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </AdminLayout>
  );
};

export default ProductsPage;

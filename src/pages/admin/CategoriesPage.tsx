import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  order: number;
  image: string;
}

const CategoriesPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [categories] = useState<Category[]>([
    { id: 1, name: 'Burgers Clássicos', order: 1, image: '' },
    { id: 2, name: 'Burgers Premium', order: 2, image: '' },
    { id: 3, name: 'Acompanhamentos', order: 3, image: '' },
    { id: 4, name: 'Bebidas', order: 4, image: '' },
    { id: 5, name: 'Sobremesas', order: 5, image: '' },
    { id: 6, name: 'Pizzas', order: 6, image: '' },
    { id: 7, name: 'Combos', order: 7, image: '' },
  ]);

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">{categories.length} categorias cadastradas</p>
            <p className="text-sm text-muted-foreground">Arraste para reordenar</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Nova Categoria
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              {/* Drag Handle */}
              <button className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="w-5 h-5" />
              </button>

              {/* Category Image */}
              <div className="w-12 h-12 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {category.image ? (
                  <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">🍔</span>
                )}
              </div>

              {/* Category Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <p className="text-sm text-muted-foreground">Ordem: {category.order}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

export default CategoriesPage;

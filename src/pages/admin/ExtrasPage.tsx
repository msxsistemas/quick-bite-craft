import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface ExtraGroup {
  id: number;
  name: string;
  description: string;
  required: boolean;
  maxSelections: number;
  optionsCount: number;
}

const ExtrasPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [extraGroups] = useState<ExtraGroup[]>([
    { id: 1, name: 'ponto_carne', description: 'Ponto da Carne', required: true, maxSelections: 1, optionsCount: 3 },
    { id: 2, name: 'adicionais', description: 'Adicionais', required: false, maxSelections: 5, optionsCount: 5 },
    { id: 3, name: 'molhos', description: 'Molhos Extras', required: false, maxSelections: 2, optionsCount: 4 },
    { id: 4, name: 'Sabores', description: 'Sabores Pizza', required: true, maxSelections: 2, optionsCount: 6 },
  ]);

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie grupos de acréscimos e suas opções</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Novo Grupo
          </button>
        </div>

        {/* Extra Groups List */}
        <div className="space-y-3">
          {extraGroups.map((group) => (
            <div 
              key={group.id} 
              className="bg-card border border-border rounded-xl p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Expand Arrow */}
                <button className="text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Group Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    {group.required && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                        Obrigatório
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
                      {group.optionsCount} opções
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {group.description} • Máx: {group.maxSelections}
                  </p>
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
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExtrasPage;

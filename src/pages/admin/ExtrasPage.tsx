import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, ChevronRight, ChevronDown, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface ExtraOption {
  id: number;
  name: string;
  price: number;
}

interface ExtraGroup {
  id: number;
  internalName: string;
  displayTitle: string;
  subtitle: string;
  required: boolean;
  maxSelections: number;
  options: ExtraOption[];
}

const ExtrasPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>([
    { 
      id: 1, 
      internalName: 'ponto_carne', 
      displayTitle: 'Ponto da Carne', 
      subtitle: '',
      required: true, 
      maxSelections: 1, 
      options: [
        { id: 1, name: 'Mal Passado', price: 0 },
        { id: 2, name: 'Ao Ponto', price: 0 },
        { id: 3, name: 'Bem Passado', price: 0 },
      ]
    },
    { 
      id: 2, 
      internalName: 'adicionais', 
      displayTitle: 'Adicionais', 
      subtitle: 'Escolha até 5 opções',
      required: false, 
      maxSelections: 5, 
      options: [
        { id: 1, name: 'Bacon Extra', price: 5 },
        { id: 2, name: 'Queijo Extra', price: 4 },
        { id: 3, name: 'Ovo', price: 3 },
        { id: 4, name: 'Cebola Caramelizada', price: 4 },
        { id: 5, name: 'Jalapeño', price: 3 },
      ]
    },
    { 
      id: 3, 
      internalName: 'molhos', 
      displayTitle: 'Molhos Extras', 
      subtitle: '',
      required: false, 
      maxSelections: 2, 
      options: [
        { id: 1, name: 'Barbecue', price: 2 },
        { id: 2, name: 'Mostarda e Mel', price: 2 },
        { id: 3, name: 'Maionese da Casa', price: 0 },
        { id: 4, name: 'Ketchup', price: 0 },
      ]
    },
    { 
      id: 4, 
      internalName: 'sabores', 
      displayTitle: 'Sabores Pizza', 
      subtitle: 'Escolha até 2 sabores',
      required: true, 
      maxSelections: 2, 
      options: [
        { id: 1, name: 'Calabresa', price: 0 },
        { id: 2, name: 'Mussarela', price: 0 },
        { id: 3, name: 'Frango', price: 0 },
        { id: 4, name: 'Portuguesa', price: 5 },
        { id: 5, name: 'Quatro Queijos', price: 8 },
        { id: 6, name: 'Margherita', price: 5 },
      ]
    },
  ]);

  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExtraGroup | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    internalName: '',
    displayTitle: '',
    subtitle: '',
    maxSelections: 1,
    required: false,
  });

  const toggleExpand = (groupId: number) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const openNewGroupModal = () => {
    setEditingGroup(null);
    setFormData({
      internalName: '',
      displayTitle: '',
      subtitle: '',
      maxSelections: 1,
      required: false,
    });
    setIsModalOpen(true);
  };

  const openEditGroupModal = (group: ExtraGroup) => {
    setEditingGroup(group);
    setFormData({
      internalName: group.internalName,
      displayTitle: group.displayTitle,
      subtitle: group.subtitle,
      maxSelections: group.maxSelections,
      required: group.required,
    });
    setIsModalOpen(true);
  };

  const handleSaveGroup = () => {
    if (editingGroup) {
      setExtraGroups(prev => prev.map(g => 
        g.id === editingGroup.id 
          ? { ...g, ...formData }
          : g
      ));
    } else {
      const newGroup: ExtraGroup = {
        id: Date.now(),
        ...formData,
        options: [],
      };
      setExtraGroups(prev => [...prev, newGroup]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteGroup = (groupId: number) => {
    setExtraGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleDeleteOption = (groupId: number, optionId: number) => {
    setExtraGroups(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, options: g.options.filter(o => o.id !== optionId) }
        : g
    ));
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `+R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie grupos de acréscimos e suas opções</p>
          </div>
          <button 
            onClick={openNewGroupModal}
            className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Novo Grupo
          </button>
        </div>

        {/* Extra Groups List */}
        <div className="space-y-3">
          {extraGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            
            return (
              <div 
                key={group.id} 
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Group Header */}
                <div className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Expand Arrow */}
                    <button 
                      onClick={() => toggleExpand(group.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    {/* Group Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-foreground">{group.internalName}</h3>
                        {group.required && (
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
                            Obrigatório
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500 text-white">
                          {group.options.length} opções
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {group.displayTitle} • Máx: {group.maxSelections}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => openEditGroupModal(group)}
                        className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Options */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {group.options.map((option) => (
                      <div 
                        key={option.id}
                        className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                      >
                        {/* Drag Handle */}
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        
                        {/* Option Name */}
                        <span className="flex-1 text-foreground">{option.name}</span>
                        
                        {/* Price */}
                        <span className={`text-sm ${option.price === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                          {formatPrice(option.price)}
                        </span>
                        
                        {/* Option Actions */}
                        <button className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteOption(group.id, option.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {/* Add Option Button */}
                    <button className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border">
                      <Plus className="w-4 h-4" />
                      Adicionar Opção
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New/Edit Group Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo de Acréscimos' : 'Novo Grupo de Acréscimos'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nome interno */}
            <div className="space-y-2">
              <Label htmlFor="internalName">Nome interno *</Label>
              <Input
                id="internalName"
                placeholder="Ex: Extras Burger"
                value={formData.internalName}
                onChange={(e) => setFormData(prev => ({ ...prev, internalName: e.target.value }))}
                className="border-amber-500 focus-visible:ring-amber-500"
              />
              <p className="text-xs text-muted-foreground">Usado para identificação no admin</p>
            </div>

            {/* Título exibido */}
            <div className="space-y-2">
              <Label htmlFor="displayTitle">Título exibido *</Label>
              <Input
                id="displayTitle"
                placeholder="Ex: Adicionais"
                value={formData.displayTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, displayTitle: e.target.value }))}
              />
            </div>

            {/* Subtítulo */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                placeholder="Ex: Escolha até 3 opções"
                value={formData.subtitle}
                onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>

            {/* Max Selections and Required */}
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="maxSelections">Máx. seleções</Label>
                <Input
                  id="maxSelections"
                  type="number"
                  min={1}
                  value={formData.maxSelections}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxSelections: parseInt(e.target.value) || 1 }))}
                  className="w-24"
                />
              </div>
              
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="required" className="cursor-pointer">Obrigatório</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGroup}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={!formData.internalName || !formData.displayTitle}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ExtrasPage;

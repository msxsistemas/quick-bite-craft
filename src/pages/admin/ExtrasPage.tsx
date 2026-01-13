import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, ChevronRight, ChevronDown, Pencil, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useExtraGroups, ExtraGroup, ExtraOption } from '@/hooks/useExtraGroups';
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableOptionProps {
  option: ExtraOption;
  groupId: string;
  onEdit: (option: ExtraOption) => void;
  onDelete: (optionId: string) => void;
  formatPrice: (price: number) => string;
}

const SortableOption = ({ option, groupId, onEdit, onDelete, formatPrice }: SortableOptionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 px-6 py-3 border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors bg-card"
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      {/* Option Name */}
      <span className="flex-1 text-foreground">{option.name}</span>
      
      {/* Price */}
      <span className={`text-sm ${option.price === 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
        {formatPrice(option.price)}
      </span>
      
      {/* Option Actions */}
      <button 
        onClick={() => onEdit(option)}
        className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button 
        onClick={() => onDelete(option.id)}
        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

// Sortable Group Component
interface SortableGroupProps {
  group: ExtraGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddOption: () => void;
  onEditOption: (option: ExtraOption) => void;
  onDeleteOption: (optionId: string) => void;
  onDragEndOptions: (event: DragEndEvent) => void;
  formatPrice: (price: number) => string;
  sensors: ReturnType<typeof useSensors>;
}

const SortableGroup = ({
  group,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddOption,
  onEditOption,
  onDeleteOption,
  onDragEndOptions,
  formatPrice,
  sensors,
}: SortableGroupProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Group Header */}
      <div className="p-4 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-4">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Expand Arrow */}
          <button 
            onClick={onToggleExpand}
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
              <h3 className="font-semibold text-foreground">{group.internal_name}</h3>
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
              {group.display_title} • Máx: {group.max_selections}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onEdit}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={onDelete}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Options with Drag and Drop */}
      {isExpanded && (
        <div className="border-t border-border">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEndOptions}
          >
            <SortableContext
              items={group.options.map(o => o.id)}
              strategy={verticalListSortingStrategy}
            >
              {group.options.map((option) => (
                <SortableOption
                  key={option.id}
                  option={option}
                  groupId={group.id}
                  onEdit={onEditOption}
                  onDelete={onDeleteOption}
                  formatPrice={formatPrice}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          {/* Add Option Button */}
          <button 
            onClick={onAddOption}
            className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors border-t border-border"
          >
            <Plus className="w-4 h-4" />
            Adicionar Opção
          </button>
        </div>
      )}
    </div>
  );
};

const ExtrasPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(slug);
  const { 
    groups, 
    isLoading, 
    createGroup, 
    updateGroup, 
    deleteGroup,
    createOption,
    updateOption,
    deleteOption,
    reorderOptions,
    reorderGroups,
  } = useExtraGroups(restaurant?.id);

  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ExtraGroup | null>(null);
  const [editingOption, setEditingOption] = useState<ExtraOption | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Group Form state
  const [groupFormData, setGroupFormData] = useState({
    internal_name: '',
    display_title: '',
    subtitle: '',
    max_selections: 1,
    required: false,
  });

  // Option Form state
  const [optionFormData, setOptionFormData] = useState({
    name: '',
    price: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Group Modal Functions
  const openNewGroupModal = () => {
    setEditingGroup(null);
    setGroupFormData({
      internal_name: '',
      display_title: '',
      subtitle: '',
      max_selections: 1,
      required: false,
    });
    setIsGroupModalOpen(true);
  };

  const openEditGroupModal = (group: ExtraGroup) => {
    setEditingGroup(group);
    setGroupFormData({
      internal_name: group.internal_name,
      display_title: group.display_title,
      subtitle: group.subtitle || '',
      max_selections: group.max_selections,
      required: group.required,
    });
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async () => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, groupFormData);
    } else {
      await createGroup(groupFormData);
    }
    setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteGroup(groupId);
  };

  // Option Modal Functions
  const openNewOptionModal = (groupId: string) => {
    setSelectedGroupId(groupId);
    setEditingOption(null);
    setOptionFormData({ name: '', price: 0 });
    setIsOptionModalOpen(true);
  };

  const openEditOptionModal = (option: ExtraOption, groupId: string) => {
    setSelectedGroupId(groupId);
    setEditingOption(option);
    setOptionFormData({ name: option.name, price: option.price });
    setIsOptionModalOpen(true);
  };

  const handleSaveOption = async () => {
    if (!selectedGroupId) return;

    if (editingOption) {
      await updateOption(editingOption.id, selectedGroupId, optionFormData);
    } else {
      await createOption(selectedGroupId, optionFormData);
    }
    setIsOptionModalOpen(false);
  };

  const handleDeleteOption = async (optionId: string, groupId: string) => {
    await deleteOption(optionId, groupId);
  };

  const handleOptionsDragEnd = (event: DragEndEvent, groupId: string) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderOptions(groupId, active.id as string, over.id as string);
    }
  };

  const handleGroupsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderGroups(active.id as string, over.id as string);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return `+R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  if (isLoadingRestaurant || isLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

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
          {groups.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-xl">
              <p className="text-muted-foreground">Nenhum grupo de acréscimos cadastrado</p>
              <button 
                onClick={openNewGroupModal}
                className="mt-4 text-amber-500 hover:text-amber-600 font-medium"
              >
                Criar primeiro grupo
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleGroupsDragEnd}
            >
              <SortableContext
                items={groups.map(g => g.id)}
                strategy={verticalListSortingStrategy}
              >
                {groups.map((group) => (
                  <SortableGroup
                    key={group.id}
                    group={group}
                    isExpanded={expandedGroups.includes(group.id)}
                    onToggleExpand={() => toggleExpand(group.id)}
                    onEdit={() => openEditGroupModal(group)}
                    onDelete={() => handleDeleteGroup(group.id)}
                    onAddOption={() => openNewOptionModal(group.id)}
                    onEditOption={(opt) => openEditOptionModal(opt, group.id)}
                    onDeleteOption={(optId) => handleDeleteOption(optId, group.id)}
                    onDragEndOptions={(event) => handleOptionsDragEnd(event, group.id)}
                    formatPrice={formatPrice}
                    sensors={sensors}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* New/Edit Group Modal */}
      <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Editar Grupo de Acréscimos' : 'Novo Grupo de Acréscimos'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nome interno */}
            <div className="space-y-2">
              <Label htmlFor="internal_name">Nome interno *</Label>
              <Input
                id="internal_name"
                placeholder="Ex: Extras Burger"
                value={groupFormData.internal_name}
                onChange={(e) => setGroupFormData(prev => ({ ...prev, internal_name: e.target.value }))}
                className="border-amber-500 focus-visible:ring-amber-500"
              />
              <p className="text-xs text-muted-foreground">Usado para identificação no admin</p>
            </div>

            {/* Título exibido */}
            <div className="space-y-2">
              <Label htmlFor="display_title">Título exibido *</Label>
              <Input
                id="display_title"
                placeholder="Ex: Adicionais"
                value={groupFormData.display_title}
                onChange={(e) => setGroupFormData(prev => ({ ...prev, display_title: e.target.value }))}
              />
            </div>

            {/* Subtítulo */}
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                placeholder="Ex: Escolha até 3 opções"
                value={groupFormData.subtitle}
                onChange={(e) => setGroupFormData(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>

            {/* Max Selections and Required */}
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="max_selections">Máx. seleções</Label>
                <Input
                  id="max_selections"
                  type="number"
                  min={1}
                  value={groupFormData.max_selections}
                  onChange={(e) => setGroupFormData(prev => ({ ...prev, max_selections: parseInt(e.target.value) || 1 }))}
                  className="w-24"
                />
              </div>
              
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  id="required"
                  checked={groupFormData.required}
                  onCheckedChange={(checked) => setGroupFormData(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="required" className="cursor-pointer">Obrigatório</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsGroupModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveGroup}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={!groupFormData.internal_name || !groupFormData.display_title}
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New/Edit Option Modal */}
      <Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingOption ? 'Editar Opção' : 'Nova Opção'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="option_name">Nome *</Label>
              <Input
                id="option_name"
                placeholder="Ex: Bacon Extra"
                value={optionFormData.name}
                onChange={(e) => setOptionFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-amber-500 focus-visible:ring-amber-500"
              />
            </div>

            {/* Preço */}
            <div className="space-y-2">
              <Label htmlFor="option_price">Preço adicional (R$)</Label>
              <Input
                id="option_price"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                value={optionFormData.price}
                onChange={(e) => setOptionFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Deixe 0 para opções sem custo adicional</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsOptionModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveOption}
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={!optionFormData.name}
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

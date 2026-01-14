import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Clock, MapPin, Plus, Eye, EyeOff, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useDeliveryZones, DeliveryZoneFormData } from '@/hooks/useDeliveryZones';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { formatCurrency } from '@/lib/format';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from 'sonner';
import type { DeliveryZone } from '@/hooks/useDeliveryZones';

type ChargeMode = 'fixed' | 'zone';

interface SortableZoneItemProps {
  zone: DeliveryZone;
  onToggleVisibility: (zone: DeliveryZone) => void;
  onEdit: (zone: DeliveryZone) => void;
  onDelete: (zone: DeliveryZone) => void;
}

const SortableZoneItem = ({ zone, onToggleVisibility, onEdit, onDelete }: SortableZoneItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: zone.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors ${
        !zone.visible ? 'opacity-50' : ''
      } ${isDragging ? 'shadow-lg bg-card' : ''}`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Zone Icon */}
      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
        <MapPin className="w-5 h-5 text-amber-600" />
      </div>

      {/* Zone Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{zone.name}</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{formatCurrency(zone.fee)}</span>
          {' '}• Pedido mín: {formatCurrency(zone.min_order)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleVisibility(zone)}
          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
          title={zone.visible ? 'Ocultar zona' : 'Mostrar zona'}
        >
          {zone.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onEdit(zone)}
          className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(zone)}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const DeliveryFeesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(slug);
  const { zones, isLoading: isLoadingZones, createZone, updateZone, deleteZone, toggleVisibility, reorderZones } = useDeliveryZones(restaurant?.id);
  const { settings, updateSettings, isLoading: isLoadingSettings } = useRestaurantSettings(restaurant?.id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [chargeMode, setChargeMode] = useState<ChargeMode>('fixed');
  const [minTime, setMinTime] = useState('30');
  const [maxTime, setMaxTime] = useState('50');
  const [fixedFee, setFixedFee] = useState(0);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<typeof zones[0] | null>(null);
  const [deletingZone, setDeletingZone] = useState<typeof zones[0] | null>(null);
  const [togglingZone, setTogglingZone] = useState<typeof zones[0] | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [zoneFormData, setZoneFormData] = useState<DeliveryZoneFormData>({
    name: '',
    fee: 0,
    min_order: 0,
  });
  const [feeDisplay, setFeeDisplay] = useState('');
  const [minOrderDisplay, setMinOrderDisplay] = useState('');

  // Load settings when they arrive
  useEffect(() => {
    if (settings) {
      setChargeMode(settings.charge_mode as ChargeMode);
      setMinTime(settings.min_delivery_time.toString());
      setMaxTime(settings.max_delivery_time.toString());
      setFixedFee(settings.fixed_delivery_fee);
    }
  }, [settings]);

  const handlePriceChange = (
    value: string, 
    setDisplay: (v: string) => void, 
    field: 'fee' | 'min_order'
  ) => {
    const numbersOnly = value.replace(/\D/g, '');
    
    if (numbersOnly === '') {
      setDisplay('');
      setZoneFormData(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    
    const cents = parseInt(numbersOnly, 10);
    const reais = cents / 100;
    
    setDisplay(reais.toFixed(2).replace('.', ','));
    setZoneFormData(prev => ({ ...prev, [field]: reais }));
  };

  const handleChargeModeChange = async (mode: ChargeMode) => {
    // Só salva se o modo realmente mudou
    if (mode === chargeMode) return;
    
    setChargeMode(mode);
    if (settings) {
      await updateSettings({ charge_mode: mode });
    }
  };

  const handleSaveTimeSettings = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      await updateSettings({
        min_delivery_time: parseInt(minTime) || 30,
        max_delivery_time: parseInt(maxTime) || 50,
        fixed_delivery_fee: fixedFee,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderZones(active.id as string, over.id as string);
    }
  };

  const openNewZoneModal = () => {
    setEditingZone(null);
    setZoneFormData({ name: '', fee: 0, min_order: 0 });
    setFeeDisplay('');
    setMinOrderDisplay('');
    setIsZoneModalOpen(true);
  };

  const openEditZoneModal = (zone: typeof zones[0]) => {
    setEditingZone(zone);
    setZoneFormData({
      name: zone.name,
      fee: zone.fee,
      min_order: zone.min_order,
    });
    setFeeDisplay(zone.fee > 0 ? zone.fee.toFixed(2).replace('.', ',') : '');
    setMinOrderDisplay(zone.min_order > 0 ? zone.min_order.toFixed(2).replace('.', ',') : '');
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async () => {
    if (!zoneFormData.name.trim()) {
      toast.error('Digite o nome da zona');
      return;
    }

    setIsSaving(true);
    try {
      if (editingZone) {
        await updateZone(editingZone.id, zoneFormData);
      } else {
        await createZone(zoneFormData);
      }
      setIsZoneModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!deletingZone) return;
    await deleteZone(deletingZone.id);
    setDeletingZone(null);
  };

  const handleConfirmToggleZone = async () => {
    if (!togglingZone) return;
    await toggleVisibility(togglingZone.id);
    setTogglingZone(null);
  };

  const isLoading = isLoadingRestaurant || isLoadingZones || isLoadingSettings;

  if (isLoading) {
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
        {/* Delivery Time Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Tempo de Entrega</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Defina o tempo estimado para as entregas</p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tempo Mínimo (min)
              </label>
              <input
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tempo Máximo (min)
              </label>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Será exibido como: {minTime}-{maxTime} min
          </p>

          <Button 
            onClick={handleSaveTimeSettings} 
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Salvar Tempo de Entrega
          </Button>
        </div>

        {/* Charge Mode Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Modo de Cobrança</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Escolha como será calculada a taxa de entrega</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleChargeModeChange('fixed')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                chargeMode === 'fixed'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  chargeMode === 'fixed' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {chargeMode === 'fixed' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Taxa Fixa</h3>
                  <p className="text-sm text-muted-foreground">Valor único para todas as entregas</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleChargeModeChange('zone')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                chargeMode === 'zone'
                  ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  chargeMode === 'zone' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {chargeMode === 'zone' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Por Bairro/Zona</h3>
                  <p className="text-sm text-muted-foreground">Taxa diferente para cada bairro ou região</p>
                </div>
              </div>
            </button>
          </div>

          {/* Fixed Fee Input */}
          {chargeMode === 'fixed' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Taxa de Entrega Fixa (R$)
              </label>
              <div className="flex gap-4">
                <CurrencyInput
                  value={fixedFee}
                  onChange={setFixedFee}
                  className="w-40 px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <Button 
                  onClick={handleSaveTimeSettings}
                  disabled={isSaving}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Zones Section */}
        {chargeMode === 'zone' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Zonas de Entrega</h2>
                <p className="text-sm text-muted-foreground">Configure a taxa para cada bairro ou região</p>
              </div>
              <button 
                onClick={openNewZoneModal}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova Zona
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={zones.map(z => z.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {zones.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma zona de entrega cadastrada.</p>
                      <button 
                        onClick={openNewZoneModal}
                        className="mt-2 text-amber-500 hover:text-amber-600 font-medium"
                      >
                        Criar primeira zona
                      </button>
                    </div>
                  ) : (
                    zones.map((zone) => (
                      <SortableZoneItem
                        key={zone.id}
                        zone={zone}
                        onToggleVisibility={setTogglingZone}
                        onEdit={openEditZoneModal}
                        onDelete={setDeletingZone}
                      />
                    ))
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Zone Modal */}
      <Dialog open={isZoneModalOpen} onOpenChange={setIsZoneModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingZone ? 'Editar Zona de Entrega' : 'Nova Zona de Entrega'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="zone_name">Nome do Bairro/Zona *</Label>
              <Input
                id="zone_name"
                value={zoneFormData.name}
                onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })}
                placeholder="Ex: Centro, Vila Mariana..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone_fee">Taxa de Entrega (R$)</Label>
                <CurrencyInput
                  id="zone_fee"
                  value={zoneFormData.fee}
                  onChange={(value) => setZoneFormData(prev => ({ ...prev, fee: value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone_min_order">Pedido Mínimo (R$)</Label>
                <CurrencyInput
                  id="zone_min_order"
                  value={zoneFormData.min_order}
                  onChange={(value) => setZoneFormData(prev => ({ ...prev, min_order: value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsZoneModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveZone} 
                disabled={isSaving || !zoneFormData.name.trim()}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingZone} onOpenChange={() => setDeletingZone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir zona de entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a zona "{deletingZone?.name}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteZone} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Visibility Confirmation */}
      <AlertDialog open={!!togglingZone} onOpenChange={() => setTogglingZone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {togglingZone?.visible ? 'Ocultar zona de entrega?' : 'Mostrar zona de entrega?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {togglingZone?.visible 
                ? `A zona "${togglingZone?.name}" não aparecerá para os clientes.`
                : `A zona "${togglingZone?.name}" aparecerá para os clientes.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmToggleZone}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {togglingZone?.visible ? 'Ocultar' : 'Mostrar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default DeliveryFeesPage;

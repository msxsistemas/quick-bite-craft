import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Clock, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useOperatingHours, getDayName, OperatingHour } from '@/hooks/useOperatingHours';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';

const HoursPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(slug);
  const { 
    hours: remoteHours, 
    isLoading: isLoadingHours,
    refetch,
  } = useOperatingHours(restaurant?.id);

  // Estado local para atualização imediata
  const [localHours, setLocalHours] = useState<OperatingHour[]>([]);
  const didInitHoursRef = useRef(false);
  const syncInFlightRef = useRef(false);

  // Reset apenas quando trocar de página (slug), evitando limpar estado em re-renders/carregamentos
  useEffect(() => {
    didInitHoursRef.current = false;
    setLocalHours([]);
  }, [slug]);

  // Inicializa quando o restaurante estiver carregado (não sobrescreve optimistics com fetch "atrasado")
  useEffect(() => {
    if (!restaurant?.id) return;
    if (didInitHoursRef.current) return;
    if (isLoadingHours) return;
    setLocalHours(remoteHours);
    didInitHoursRef.current = true;
  }, [restaurant?.id, isLoadingHours, remoteHours]);

  const hours = localHours;

  const syncFromBackend = async (accept: (rows: OperatingHour[]) => boolean) => {
    if (syncInFlightRef.current) return;
    syncInFlightRef.current = true;
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const rows = await refetch();
        if (accept(rows)) {
          setLocalHours(rows);
          return;
        }
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    } finally {
      syncInFlightRef.current = false;
    }
  };

  const [deleteHourId, setDeleteHourId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<OperatingHour | null>(null);
  
  // Form state
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(0);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('22:00');
  const [formActive, setFormActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingById, setPendingById] = useState<Record<string, boolean>>({});
  const [isInitializingDefaults, setIsInitializingDefaults] = useState(false);

  const isInitialLoading = isLoadingRestaurant || (isLoadingHours && localHours.length === 0);

  // Get days that already have hours configured
  const configuredDays = hours.map(h => h.day_of_week);
  const availableDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !configuredDays.includes(d) || editingHour?.day_of_week === d);

  const resetForm = () => {
    setFormDayOfWeek(availableDays[0] ?? 0);
    setFormStartTime('09:00');
    setFormEndTime('22:00');
    setFormActive(true);
    setEditingHour(null);
  };

  const openNewHourModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (hour: OperatingHour) => {
    setEditingHour(hour);
    setFormDayOfWeek(hour.day_of_week);
    // Garantir formato HH:MM (remover segundos se existirem)
    setFormStartTime(hour.start_time.slice(0, 5));
    setFormEndTime(hour.end_time.slice(0, 5));
    setFormActive(hour.active);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!restaurant?.id) {
      toast.error('Restaurante não carregado');
      return;
    }

    setIsSubmitting(true);
    try {
      const start_time = formStartTime.slice(0, 5);
      const end_time = formEndTime.slice(0, 5);

      if (editingHour) {
        const { data, error } = await supabase
          .from('operating_hours')
          .update({
            day_of_week: formDayOfWeek,
            start_time,
            end_time,
            active: formActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingHour.id)
          .select('*')
          .single();

        if (error) throw error;

        // Atualização local imediata
        setLocalHours((prev) => prev.map((h) => (h.id === editingHour.id ? (data as OperatingHour) : h)));
        toast.success('Horário atualizado!');
      } else {
        const { data, error } = await supabase
          .from('operating_hours')
          .insert({
            restaurant_id: restaurant.id,
            day_of_week: formDayOfWeek,
            start_time,
            end_time,
            active: formActive,
          })
          .select('*')
          .single();

        if (error) throw error;

        // Atualização local imediata
        setLocalHours((prev) => [...prev, data as OperatingHour]);
        toast.success('Horário adicionado!');
      }

      // Sincronizar em background
      refetch();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving operating hour:', error);
      toast.error(error?.message ? `Erro ao salvar: ${error.message}` : 'Erro ao salvar horário');
      // Re-sincronizar (caso o estado local tenha ficado diferente)
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteHourId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteHourId) return;
    if (pendingById[deleteHourId]) return;

    const idToDelete = deleteHourId;

    // Atualização local imediata (antes de fechar o dialog)
    setLocalHours((prev) => prev.filter((h) => h.id !== idToDelete));

    // Fechar o dialog imediatamente
    setDeleteHourId(null);

    setPendingById((prev) => ({ ...prev, [idToDelete]: true }));
    try {
      const { error } = await supabase
        .from('operating_hours')
        .delete()
        .eq('id', idToDelete);

      if (error) throw error;
      toast.success('Horário excluído!');
    } catch (error: any) {
      console.error('Error deleting operating hour:', error);
      toast.error(error?.message ? `Erro ao excluir: ${error.message}` : 'Erro ao excluir horário');
      // Reverter em caso de erro
      refetch();
    } finally {
      setPendingById((prev) => {
        const next = { ...prev };
        delete next[idToDelete];
        return next;
      });
    }
  };

  const handleToggleActive = async (id: string, nextActive: boolean) => {
    if (pendingById[id]) return;

    // Atualização local imediata (optimistic update)
    setLocalHours((prev) =>
      prev.map((h) => (h.id === id ? { ...h, active: nextActive } : h))
    );

    setPendingById((prev) => ({ ...prev, [id]: true }));
    try {
      const { error } = await supabase
        .from('operating_hours')
        .update({ active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      // Refetch em background para sincronizar
      refetch();
    } catch (error: any) {
      console.error('Error toggling operating hour:', error);
      toast.error(error?.message ? `Erro ao atualizar: ${error.message}` : 'Erro ao atualizar horário');
      // Reverter em caso de erro
      refetch();
    } finally {
      setPendingById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleInitializeDefaultHours = async () => {
    if (!restaurant?.id) {
      toast.error('Restaurante não carregado');
      return;
    }
    if (isInitializingDefaults) return;

    setIsInitializingDefaults(true);
    try {
      // Verificar se já existem horários no banco antes de inserir
      const { data: existingHours, error: checkError } = await supabase
        .from('operating_hours')
        .select('id')
        .eq('restaurant_id', restaurant.id)
        .limit(1);

      if (checkError) throw checkError;

      if (existingHours && existingHours.length > 0) {
        // Horários existem no banco mas não estão sendo exibidos - refetch
        toast.info('Carregando horários existentes...');
        const rows = await refetch();
        setLocalHours(rows);
        return;
      }

      const defaultHours = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        restaurant_id: restaurant.id,
        day_of_week: day,
        start_time: '09:00',
        end_time: '22:00',
        active: day !== 0,
      }));

      const { data, error } = await supabase
        .from('operating_hours')
        .insert(defaultHours)
        .select('*');

      if (error) throw error;
      
      // Atualização local imediata
      if (data) {
        setLocalHours(data as OperatingHour[]);
      }
      toast.success('Horários padrão criados!');
      // Sincronizar em background
      refetch();
    } catch (error: any) {
      console.error('Error initializing default hours:', error);
      toast.error(error?.message ? `Erro ao criar padrões: ${error.message}` : 'Erro ao criar horários padrão');
      refetch();
    } finally {
      setIsInitializingDefaults(false);
    }
  };

  // Sort hours by day of week
  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week);

  if (isInitialLoading) {
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
      <div className="space-y-6 max-w-2xl">
        {/* Header Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">Configure os horários de funcionamento</h2>
              <p className="text-sm text-muted-foreground">Defina quando sua loja está aberta para receber pedidos</p>
            </div>
            <Button 
              onClick={openNewHourModal}
              disabled={availableDays.length === 0}
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Initialize Default Hours Button */}
        {hours.length === 0 && (
          <div className="text-center py-8 bg-card border border-border rounded-xl">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhum horário cadastrado</p>
            <Button onClick={handleInitializeDefaultHours} variant="outline" disabled={isInitializingDefaults}>
              {isInitializingDefaults ? 'Criando...' : 'Criar horários padrão (Seg-Sáb 09:00-22:00)'}
            </Button>
          </div>
        )}

        {/* Schedule List */}
        {sortedHours.length > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {sortedHours.map((hour) => (
              <div
                key={hour.id}
                className="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
              >
                {/* Toggle */}
                <Switch
                  checked={hour.active}
                  onCheckedChange={(checked) => handleToggleActive(hour.id, checked)}
                  disabled={!!pendingById[hour.id]}
                  className="data-[state=checked]:bg-amber-500"
                />

                {/* Day Name */}
                <span className={`font-medium w-24 ${hour.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {getDayName(hour.day_of_week)}
                </span>

                {/* Time Range - Exibir apenas HH:MM */}
                <span className={`text-sm ${hour.active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                  {hour.start_time.slice(0, 5)} às {hour.end_time.slice(0, 5)}
                </span>

                {/* Status Badge */}
                {!hour.active && (
                  <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                    Fechado
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    onClick={() => openEditModal(hour)}
                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(hour.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Note */}
        {hours.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            As alterações são salvas automaticamente
          </p>
        )}
      </div>

      {/* New/Edit Hour Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingHour ? 'Editar Horário' : 'Novo Horário'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Day of Week */}
            <div className="space-y-2">
              <Label>Dia da semana</Label>
              <Select 
                value={formDayOfWeek.toString()} 
                onValueChange={(v) => setFormDayOfWeek(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(editingHour ? [0, 1, 2, 3, 4, 5, 6] : availableDays).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {getDayName(day)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário de abertura</Label>
                <input
                  id="start_time"
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Horário de fechamento</Label>
                <input
                  id="end_time"
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Aberto neste dia</Label>
              <Switch
                id="active"
                checked={formActive}
                onCheckedChange={setFormActive}
                className="data-[state=checked]:bg-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingHour ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteHourId}
        onOpenChange={() => setDeleteHourId(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir horário?"
        description="Esta ação não pode ser desfeita. O horário de funcionamento será removido."
      />
    </AdminLayout>
  );
};

export default HoursPage;

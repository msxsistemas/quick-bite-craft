import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';

export interface DeliveryZone {
  id: string;
  restaurant_id: string;
  name: string;
  fee: number;
  min_order: number;
  visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZoneFormData {
  name: string;
  fee: number;
  min_order: number;
  visible?: boolean;
}

export const useDeliveryZones = (restaurantId: string | undefined) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const togglingIdsRef = useRef<Set<string>>(new Set());

  const fetchZones = useCallback(async () => {
    if (!restaurantId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order');

      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      toast.error('Erro ao carregar zonas de entrega');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Real-time subscription for delivery zones
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`delivery-zones-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_zones',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newZone = payload.new as DeliveryZone;
            // Guard against duplicate INSERT events
            setZones((prev) => {
              if (prev.some((z) => z.id === newZone.id)) return prev;
              return [...prev, newZone].sort((a, b) => a.sort_order - b.sort_order);
            });
          } else if (payload.eventType === 'UPDATE') {
            setZones(prev => prev.map(z => z.id === (payload.new as DeliveryZone).id ? payload.new as DeliveryZone : z));
          } else if (payload.eventType === 'DELETE') {
            setZones(prev => prev.filter(z => z.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  const createZone = async (formData: DeliveryZoneFormData) => {
    if (!restaurantId) return;

    try {
      const maxSortOrder = zones.length > 0 
        ? Math.max(...zones.map(z => z.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('delivery_zones')
        .insert({
          restaurant_id: restaurantId,
          name: formData.name,
          fee: formData.fee,
          min_order: formData.min_order,
          visible: formData.visible ?? true,
          sort_order: maxSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza imediatamente a UI (fallback caso o realtime demore/não dispare)
      // O listener de INSERT já tem proteção contra duplicados por id.
      setZones((prev) => {
        if (!data) return prev;
        if (prev.some((z) => z.id === data.id)) return prev;
        return [...prev, data].sort((a, b) => a.sort_order - b.sort_order);
      });

      toast.success('Zona de entrega criada com sucesso!');
      return data;
    } catch (error) {
      console.error('Error creating delivery zone:', error);
      toast.error('Erro ao criar zona de entrega');
      throw error;
    }
  };

  const updateZone = async (id: string, formData: Partial<DeliveryZoneFormData>) => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setZones(prev => prev.map(z => z.id === id ? data : z));
      toast.success('Zona de entrega atualizada!');
      return data;
    } catch (error) {
      console.error('Error updating delivery zone:', error);
      toast.error('Erro ao atualizar zona de entrega');
      throw error;
    }
  };

  const deleteZone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setZones(prev => prev.filter(z => z.id !== id));
      toast.success('Zona de entrega excluída!');
    } catch (error) {
      console.error('Error deleting delivery zone:', error);
      toast.error('Erro ao excluir zona de entrega');
      throw error;
    }
  };

  const toggleVisibility = async (id: string) => {
    // Prevent multiple rapid clicks
    if (togglingIdsRef.current.has(id)) return;
    
    const zone = zones.find(z => z.id === id);
    if (!zone) return;

    togglingIdsRef.current.add(id);
    try {
      await updateZone(id, { visible: !zone.visible });
    } finally {
      togglingIdsRef.current.delete(id);
    }
  };

  const reorderZones = async (activeId: string, overId: string) => {
    const oldIndex = zones.findIndex(z => z.id === activeId);
    const newIndex = zones.findIndex(z => z.id === overId);

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    // Reorder locally first for instant feedback
    const reordered = [...zones];
    const [movedItem] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, movedItem);

    // Update sort_order for each item
    const updatedZones = reordered.map((zone, index) => ({
      ...zone,
      sort_order: index,
    }));

    setZones(updatedZones);

    // Persist to database
    try {
      const updates = updatedZones.map((zone) =>
        supabase
          .from('delivery_zones')
          .update({ sort_order: zone.sort_order })
          .eq('id', zone.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering zones:', error);
      toast.error('Erro ao reordenar zonas');
      // Revert on error
      fetchZones();
    }
  };

  return {
    zones,
    isLoading,
    createZone,
    updateZone,
    deleteZone,
    toggleVisibility,
    reorderZones,
    refetch: fetchZones,
  };
};

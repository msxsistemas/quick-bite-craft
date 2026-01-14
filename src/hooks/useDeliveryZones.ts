import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
            setZones(prev => [...prev, payload.new as DeliveryZone].sort((a, b) => a.sort_order - b.sort_order));
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

      // Don't add to local state - real-time subscription will handle it
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
    const zone = zones.find(z => z.id === id);
    if (!zone) return;

    await updateZone(id, { visible: !zone.visible });
  };

  return {
    zones,
    isLoading,
    createZone,
    updateZone,
    deleteZone,
    toggleVisibility,
    refetch: fetchZones,
  };
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExtraOption {
  id: string;
  group_id: string;
  name: string;
  price: number;
  sort_order: number;
  active: boolean;
}

export interface ExtraGroup {
  id: string;
  restaurant_id: string;
  internal_name: string;
  display_title: string;
  subtitle: string | null;
  max_selections: number;
  required: boolean;
  sort_order: number;
  active: boolean;
  options: ExtraOption[];
}

export interface ExtraGroupInput {
  internal_name: string;
  display_title: string;
  subtitle?: string;
  max_selections: number;
  required: boolean;
}

export interface ExtraOptionInput {
  name: string;
  price: number;
}

export const useExtraGroups = (restaurantId: string | undefined) => {
  const [groups, setGroups] = useState<ExtraGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('extra_groups')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (groupsError) throw groupsError;

      // Fetch all options for these groups
      const groupIds = groupsData?.map(g => g.id) || [];
      
      let optionsData: any[] = [];
      if (groupIds.length > 0) {
        const { data, error: optionsError } = await supabase
          .from('extra_options')
          .select('*')
          .in('group_id', groupIds)
          .order('sort_order', { ascending: true });

        if (optionsError) throw optionsError;
        optionsData = data || [];
      }

      // Combine groups with their options
      const groupsWithOptions: ExtraGroup[] = (groupsData || []).map(group => ({
        ...group,
        options: optionsData.filter(opt => opt.group_id === group.id)
      }));

      setGroups(groupsWithOptions);
    } catch (error: any) {
      console.error('Error fetching extra groups:', error);
      toast.error('Erro ao carregar grupos de acréscimos');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const createGroup = async (input: ExtraGroupInput) => {
    if (!restaurantId) return null;

    try {
      const maxSortOrder = groups.length > 0 
        ? Math.max(...groups.map(g => g.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('extra_groups')
        .insert({
          restaurant_id: restaurantId,
          internal_name: input.internal_name,
          display_title: input.display_title,
          subtitle: input.subtitle || null,
          max_selections: input.max_selections,
          required: input.required,
          sort_order: maxSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newGroup: ExtraGroup = { ...data, options: [] };
      setGroups(prev => [...prev, newGroup]);
      toast.success('Grupo criado com sucesso!');
      return newGroup;
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error('Erro ao criar grupo');
      return null;
    }
  };

  const updateGroup = async (id: string, input: Partial<ExtraGroupInput>) => {
    try {
      const { error } = await supabase
        .from('extra_groups')
        .update({
          internal_name: input.internal_name,
          display_title: input.display_title,
          subtitle: input.subtitle || null,
          max_selections: input.max_selections,
          required: input.required,
        })
        .eq('id', id);

      if (error) throw error;

      setGroups(prev => prev.map(g => 
        g.id === id ? { ...g, ...input } : g
      ));
      toast.success('Grupo atualizado com sucesso!');
    } catch (error: any) {
      console.error('Error updating group:', error);
      toast.error('Erro ao atualizar grupo');
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { error } = await supabase
        .from('extra_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== id));
      toast.success('Grupo excluído com sucesso!');
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao excluir grupo');
    }
  };

  const createOption = async (groupId: string, input: ExtraOptionInput) => {
    try {
      const group = groups.find(g => g.id === groupId);
      const maxSortOrder = group && group.options.length > 0
        ? Math.max(...group.options.map(o => o.sort_order)) + 1
        : 0;

      const { data, error } = await supabase
        .from('extra_options')
        .insert({
          group_id: groupId,
          name: input.name,
          price: input.price,
          sort_order: maxSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, options: [...g.options, data] }
          : g
      ));
      toast.success('Opção criada com sucesso!');
      return data;
    } catch (error: any) {
      console.error('Error creating option:', error);
      toast.error('Erro ao criar opção');
      return null;
    }
  };

  const updateOption = async (optionId: string, groupId: string, input: Partial<ExtraOptionInput>) => {
    try {
      const { error } = await supabase
        .from('extra_options')
        .update({
          name: input.name,
          price: input.price,
        })
        .eq('id', optionId);

      if (error) throw error;

      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { 
              ...g, 
              options: g.options.map(o => 
                o.id === optionId ? { ...o, ...input } : o
              )
            }
          : g
      ));
      toast.success('Opção atualizada com sucesso!');
    } catch (error: any) {
      console.error('Error updating option:', error);
      toast.error('Erro ao atualizar opção');
    }
  };

  const deleteOption = async (optionId: string, groupId: string) => {
    try {
      const { error } = await supabase
        .from('extra_options')
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, options: g.options.filter(o => o.id !== optionId) }
          : g
      ));
      toast.success('Opção excluída com sucesso!');
    } catch (error: any) {
      console.error('Error deleting option:', error);
      toast.error('Erro ao excluir opção');
    }
  };

  const reorderOptions = async (groupId: string, activeId: string, overId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const options = [...group.options];
    const activeIndex = options.findIndex(o => o.id === activeId);
    const overIndex = options.findIndex(o => o.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    const [movedOption] = options.splice(activeIndex, 1);
    options.splice(overIndex, 0, movedOption);

    // Update local state immediately
    const updatedOptions = options.map((opt, index) => ({
      ...opt,
      sort_order: index
    }));

    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, options: updatedOptions } : g
    ));

    // Update in database
    try {
      const updates = updatedOptions.map(opt => 
        supabase
          .from('extra_options')
          .update({ sort_order: opt.sort_order })
          .eq('id', opt.id)
      );
      await Promise.all(updates);
    } catch (error) {
      console.error('Error reordering options:', error);
      toast.error('Erro ao reordenar opções');
      fetchGroups(); // Revert on error
    }
  };

  return {
    groups,
    isLoading,
    createGroup,
    updateGroup,
    deleteGroup,
    createOption,
    updateOption,
    deleteOption,
    reorderOptions,
    refetch: fetchGroups,
  };
};

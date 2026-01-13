import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  emoji: string;
  image_url: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  emoji: string;
  image_url?: string | null;
}

export const useCategories = (restaurantId: string | undefined) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Erro ao carregar categorias',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (formData: CategoryFormData) => {
    if (!restaurantId) return null;

    try {
      const maxOrder = categories.length > 0 
        ? Math.max(...categories.map(c => c.sort_order)) 
        : 0;

      const { data, error } = await supabase
        .from('categories')
        .insert({
          restaurant_id: restaurantId,
          name: formData.name,
          emoji: formData.emoji,
          image_url: formData.image_url || null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      toast({
        title: 'Categoria criada',
        description: 'A categoria foi criada com sucesso.',
      });
      return data;
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: 'Erro ao criar categoria',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCategory = async (categoryId: string, formData: CategoryFormData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: formData.name,
          emoji: formData.emoji,
          image_url: formData.image_url || null,
        })
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;

      setCategories(prev =>
        prev.map(c => (c.id === categoryId ? data : c))
      );
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: 'Erro ao atualizar categoria',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.filter(c => c.id !== categoryId));
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erro ao excluir categoria',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const reorderCategories = async (reorderedCategories: Category[]) => {
    try {
      const updates = reorderedCategories.map((category, index) => ({
        id: category.id,
        restaurant_id: category.restaurant_id,
        name: category.name,
        emoji: category.emoji,
        image_url: category.image_url,
        sort_order: index,
        active: category.active,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('categories')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      setCategories(reorderedCategories.map((c, i) => ({ ...c, sort_order: i })));
    } catch (error: any) {
      console.error('Error reordering categories:', error);
      toast({
        title: 'Erro ao reordenar categorias',
        description: error.message,
        variant: 'destructive',
      });
      fetchCategories();
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [restaurantId]);

  // Real-time subscription for categories
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`categories-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Category update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCategories(prev => [...prev, payload.new as Category].sort((a, b) => a.sort_order - b.sort_order));
          } else if (payload.eventType === 'UPDATE') {
            setCategories(prev => prev.map(c => c.id === (payload.new as Category).id ? payload.new as Category : c));
          } else if (payload.eventType === 'DELETE') {
            setCategories(prev => prev.filter(c => c.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: fetchCategories,
  };
};

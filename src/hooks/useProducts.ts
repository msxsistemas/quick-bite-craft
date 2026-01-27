import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/app-toast';

export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  image_url: string | null;
  active: boolean;
  visible: boolean;
  sold_out: boolean;
  extra_groups: string[];
  sort_order: number;
  is_promo: boolean;
  promo_price: number | null;
  promo_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  category?: string;
  price: number;
  image_url?: string;
  extra_groups?: string[];
  is_promo?: boolean;
  promo_price?: number | null;
  promo_expires_at?: string | null;
}

export const useProducts = (restaurantId: string | undefined) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const togglingIdsRef = useRef<Set<string>>(new Set());
  const creatingRef = useRef(false);
  const refetchTimerRef = useRef<number | null>(null);
  const hasLoadedOnceRef = useRef(false);

  const normalizeProducts = (list: Product[]) => {
    // Ensure stable, de-duplicated list by `id` (last write wins)
    const byId = new Map<string, Product>();
    for (const p of list) byId.set(p.id, p);
    return Array.from(byId.values()).sort((a, b) => a.sort_order - b.sort_order);
  };

  const fetchProducts = useCallback(async () => {
    if (!restaurantId) {
      hasLoadedOnceRef.current = false;
      setProducts([]);
      setIsLoading(false);
      return;
    }

    // Avoid UI flicker: only show the global loader on the very first load
    const shouldShowLoader = !hasLoadedOnceRef.current;
    if (shouldShowLoader) setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((item) => ({
        ...item,
        extra_groups: item.extra_groups || [],
      })) as Product[];

      setProducts(normalizeProducts(transformedData));
      hasLoadedOnceRef.current = true;
    } catch (error: any) {
      console.error('Error fetching products:', error);
    } finally {
      if (shouldShowLoader) setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    // When switching restaurants, reset state so we can show the initial loader again
    hasLoadedOnceRef.current = false;
    setProducts([]);

    if (restaurantId) {
      fetchProducts();
    } else {
      setIsLoading(false);
    }
  }, [restaurantId, fetchProducts]);

  // Safety net: if something causes duplicated items in memory, normalize it.
  useEffect(() => {
    const ids = new Set<string>();
    let hasDup = false;
    for (const p of products) {
      if (ids.has(p.id)) {
        hasDup = true;
        break;
      }
      ids.add(p.id);
    }
    if (!hasDup) return;
    setProducts((prev) => normalizeProducts(prev));
  }, [products]);

  // Real-time subscription for products
  useEffect(() => {
    if (!restaurantId) return;

    const scheduleRefetch = () => {
      if (refetchTimerRef.current) return;
      refetchTimerRef.current = window.setTimeout(() => {
        refetchTimerRef.current = null;
        fetchProducts();
      }, 50);
    };

    const channel = supabase
      .channel(`products-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Product update:', payload);
          // Refetch full list to avoid any duplication/race conditions
          scheduleRefetch();
        }
      )
      .subscribe();

    return () => {
      if (refetchTimerRef.current) {
        window.clearTimeout(refetchTimerRef.current);
        refetchTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchProducts]);

  const createProduct = async (input: ProductInput) => {
    if (!restaurantId) return null;
    if (creatingRef.current) return null;

    creatingRef.current = true;
    try {
      const maxSortOrder = products.length > 0 
        ? Math.max(...products.map(p => p.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          name: input.name,
          description: input.description || null,
          category: input.category || null,
          price: input.price,
          image_url: input.image_url || null,
          extra_groups: input.extra_groups || [],
          sort_order: maxSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct = {
        ...data,
        extra_groups: data.extra_groups || [],
      } as Product;

      // Update local state immediately for instant feedback
      setProducts(prev => {
        if (prev.some(p => p.id === newProduct.id)) return prev;
        return normalizeProducts([...prev, newProduct]);
      });
      toast.success('Produto criado com sucesso!');
      return newProduct;
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error('Erro ao criar produto');
      return null;
    } finally {
      creatingRef.current = false;
    }
  };

  const updateProduct = async (id: string, input: Partial<ProductInput>) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProduct = {
        ...data,
        extra_groups: data.extra_groups || [],
      } as Product;

      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Produto atualizado com sucesso!');
      return updatedProduct;
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
      return null;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto excluído com sucesso!');
      return true;
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
      return false;
    }
  };

  const toggleActive = async (id: string) => {
    // Prevent multiple rapid clicks
    if (togglingIdsRef.current.has(id)) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    togglingIdsRef.current.add(id);
    const newActive = !product.active;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: newActive })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, active: newActive } : p
      ));
      toast.success(newActive ? 'Produto ativado!' : 'Produto desativado!');
    } catch (error: any) {
      console.error('Error toggling product active:', error);
      toast.error('Erro ao alterar status do produto');
    } finally {
      togglingIdsRef.current.delete(id);
    }
  };

  const toggleVisibility = async (id: string) => {
    // Prevent multiple rapid clicks
    if (togglingIdsRef.current.has(id)) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    togglingIdsRef.current.add(id);
    const newVisible = !product.visible;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ visible: newVisible })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, visible: newVisible } : p
      ));
    } catch (error: any) {
      console.error('Error toggling product visibility:', error);
      toast.error('Erro ao alterar visibilidade do produto');
    } finally {
      togglingIdsRef.current.delete(id);
    }
  };

  const toggleSoldOut = async (id: string) => {
    // Prevent multiple rapid clicks
    if (togglingIdsRef.current.has(id)) return;
    
    const product = products.find(p => p.id === id);
    if (!product) return;

    togglingIdsRef.current.add(id);
    const newSoldOut = !product.sold_out;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({ sold_out: newSoldOut })
        .eq('id', id);

      if (error) throw error;

      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, sold_out: newSoldOut } : p
      ));
      toast.success(newSoldOut ? 'Produto marcado como esgotado!' : 'Produto disponível novamente!');
    } catch (error: any) {
      console.error('Error toggling product sold_out:', error);
      toast.error('Erro ao alterar status do produto');
    } finally {
      togglingIdsRef.current.delete(id);
    }
  };

  const reorderProducts = async (activeId: string, overId: string) => {
    const oldIndex = products.findIndex(p => p.id === activeId);
    const newIndex = products.findIndex(p => p.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newProducts = [...products];
    const [movedProduct] = newProducts.splice(oldIndex, 1);
    newProducts.splice(newIndex, 0, movedProduct);

    // Update sort_order for all affected products
    const updatedProducts = newProducts.map((p, index) => ({
      ...p,
      sort_order: index,
    }));

    setProducts(updatedProducts);

    // Update in database
    try {
      const updates = updatedProducts.map(p => 
        supabase
          .from('products')
          .update({ sort_order: p.sort_order })
          .eq('id', p.id)
      );

      await Promise.all(updates);
    } catch (error: any) {
      console.error('Error reordering products:', error);
      toast.error('Erro ao reordenar produtos');
      // Revert on error
      fetchProducts();
    }
  };

  const duplicateProduct = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product || !restaurantId) return null;

    try {
      const maxSortOrder = products.length > 0 
        ? Math.max(...products.map(p => p.sort_order)) + 1 
        : 0;

      const { data, error } = await supabase
        .from('products')
        .insert({
          restaurant_id: restaurantId,
          name: `${product.name} (cópia)`,
          description: product.description,
          category: product.category,
          price: product.price,
          image_url: product.image_url,
          extra_groups: product.extra_groups || [],
          sort_order: maxSortOrder,
          active: product.active,
          visible: false, // Start as hidden so user can edit before showing
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct = {
        ...data,
        extra_groups: data.extra_groups || [],
      } as Product;

      // Update local state immediately for instant feedback
      setProducts(prev => {
        if (prev.some(p => p.id === newProduct.id)) return prev;
        return normalizeProducts([...prev, newProduct]);
      });
      toast.success('Produto duplicado com sucesso!');
      return newProduct;
    } catch (error: any) {
      console.error('Error duplicating product:', error);
      toast.error('Erro ao duplicar produto');
      return null;
    }
  };

  return {
    products,
    isLoading,
    createProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    toggleActive,
    toggleVisibility,
    toggleSoldOut,
    reorderProducts,
    refetch: fetchProducts,
  };
};

export const uploadProductImage = async (file: File, restaurantId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${restaurantId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error('Erro ao fazer upload da imagem');
    return null;
  }
};

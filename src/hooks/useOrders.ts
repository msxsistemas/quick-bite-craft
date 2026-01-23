import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from '@/components/ui/app-toast';

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  notes?: string;
  extras?: {
    groupId: string;
    groupTitle: string;
    optionId: string;
    optionName: string;
    price: number;
  }[];
}

export interface Order {
  id: string;
  restaurant_id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_zone_id: string | null;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon_id: string | null;
  payment_method: string;
  payment_change: number | null;
  status: OrderStatus;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  delivering_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  waiter_id: string | null;
  tip_amount: number;
  table_id: string | null;
  comanda_id: string | null;
}

export interface CreateOrderData {
  restaurant_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address?: string;
  delivery_zone_id?: string;
  delivery_fee: number;
  subtotal: number;
  discount: number;
  total: number;
  coupon_id?: string;
  payment_method: string;
  payment_change?: number;
  notes?: string;
  items: OrderItem[];
  waiter_id?: string;
  tip_amount?: number;
  table_id?: string;
}

export const useOrders = (restaurantId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['orders', restaurantId],
    queryFn: async () => {
      if (!restaurantId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        items: d.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!restaurantId,
  });

  // Real-time subscription - only invalidate cache, notifications handled by useGlobalKitchenNotification
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          console.log('Order update:', payload);
          // Note: Notifications for new orders are handled by useGlobalKitchenNotification
          // to avoid duplicates when orders are created locally
          queryClient.invalidateQueries({ queryKey: ['orders', restaurantId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, queryClient]);

  return query;
};

export const useOrderByPhone = (restaurantId: string | undefined, phone: string | undefined) => {
  return useQuery({
    queryKey: ['orders', 'phone', restaurantId, phone],
    queryFn: async () => {
      if (!restaurantId || !phone) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('customer_phone', phone)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        items: d.items as unknown as OrderItem[],
      })) as Order[];
    },
    enabled: !!restaurantId && !!phone,
  });
};

export const useOrderById = (orderId: string | undefined) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as OrderItem[],
      } as Order;
    },
    enabled: !!orderId,
  });

  // Real-time subscription for single order
  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, queryClient]);

  return query;
};

export const useCreateOrder = () => {
  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          restaurant_id: orderData.restaurant_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          customer_address: orderData.customer_address || null,
          delivery_zone_id: orderData.delivery_zone_id || null,
          delivery_fee: orderData.delivery_fee,
          subtotal: orderData.subtotal,
          discount: orderData.discount,
          total: orderData.total,
          coupon_id: orderData.coupon_id || null,
          payment_method: orderData.payment_method,
          payment_change: orderData.payment_change || null,
          notes: orderData.notes || null,
          items: JSON.parse(JSON.stringify(orderData.items)),
          waiter_id: orderData.waiter_id || null,
          tip_amount: orderData.tip_amount || 0,
          table_id: orderData.table_id || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as OrderItem[],
      } as Order;
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const timestampField = {
        accepted: 'accepted_at',
        preparing: 'preparing_at',
        ready: 'ready_at',
        delivering: 'delivering_at',
        delivered: 'delivered_at',
        cancelled: 'cancelled_at',
      }[status];

      const updateData: Record<string, unknown> = { status };
      if (timestampField) {
        updateData[timestampField] = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as OrderItem[],
      } as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
    },
  });
};

export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, items, subtotal, total }: { orderId: string; items: OrderItem[]; subtotal: number; total: number }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          items: JSON.parse(JSON.stringify(items)),
          subtotal,
          total,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        items: data.items as unknown as OrderItem[],
      } as Order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', data.id] });
    },
  });
};

export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendente',
    accepted: 'Aceito',
    preparing: 'Em Preparo',
    ready: 'Pronto',
    delivering: 'Saiu para Entrega',
    delivered: 'Entregue',
    cancelled: 'Cancelado',
  };
  return labels[status] || status;
};

export const getStatusColor = (status: OrderStatus): { bg: string; text: string; border: string } => {
  const colors: Record<OrderStatus, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
    accepted: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
    preparing: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-400' },
    ready: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
    delivering: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-400' },
    delivered: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' },
  };
  return colors[status] || { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' };
};

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from './useOrders';

type DateFilter = 'today' | 'week' | 'month';

interface DashboardStats {
  pendingOrders: number;
  preparingOrders: number;
  openTables: number;
  customersToday: number;
  totalRevenue: number;
  totalOrders: number;
  avgTicket: number;
  avgTableTime: number;
  closedTables: number;
  deliveryRevenue: number;
  deliveryOrders: number;
  salonRevenue: number;
  salonOrders: number;
  completedDeliveries: number;
  cancelRate: number;
  itemsSold: number;
  paymentMethods: { name: string; value: number; color: string }[];
  topProducts: { name: string; price: string; quantity: string }[];
  peakHours: { time: string; orders: string; value: string }[];
  hourlyData: { hour: string; value: number }[];
}

const getDateRange = (filter: DateFilter) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (filter) {
    case 'today':
      return startOfToday.toISOString();
    case 'week':
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      return startOfWeek.toISOString();
    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return startOfMonth.toISOString();
    default:
      return startOfToday.toISOString();
  }
};

export const useDashboardStats = (restaurantId: string | undefined, dateFilter: DateFilter = 'today') => {
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`dashboard-stats-${restaurantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', restaurantId, dateFilter] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats', restaurantId, dateFilter] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, dateFilter, queryClient]);

  return useQuery({
    queryKey: ['dashboard-stats', restaurantId, dateFilter],
    queryFn: async (): Promise<DashboardStats> => {
      if (!restaurantId) {
        return getEmptyStats();
      }

      const startDate = getDateRange(dateFilter);

      // Fetch orders for the period
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      // Fetch open tables
      const { count: openTablesCount } = await supabase
        .from('tables')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)
        .eq('status', 'occupied');

      // Calculate stats
      const allOrders = (orders || []).map(o => ({
        ...o,
        items: o.items as unknown as OrderItem[],
      })) as Order[];

      const validOrders = allOrders.filter(o => o.status !== 'cancelled');
      const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');
      const deliveredOrders = validOrders.filter(o => o.status === 'delivered');
      
      // Pending and preparing counts
      const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
      const preparingOrders = allOrders.filter(o => ['accepted', 'preparing'].includes(o.status)).length;

      // Revenue calculations
      const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
      const avgTicket = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

      // Delivery vs Salon
      const deliveryOrders = validOrders.filter(o => o.customer_address && !o.table_id && !o.comanda_id);
      const salonOrders = validOrders.filter(o => o.table_id || o.comanda_id);
      
      const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
      const salonRevenue = salonOrders.reduce((sum, o) => sum + o.total, 0);

      // Completed deliveries
      const completedDeliveries = deliveryOrders.filter(o => o.status === 'delivered').length;

      // Closed tables (delivered salon orders)
      const closedTables = salonOrders.filter(o => o.status === 'delivered').length;

      // Cancel rate
      const cancelRate = allOrders.length > 0 ? (cancelledOrders.length / allOrders.length) * 100 : 0;

      // Items sold
      const itemsSold = validOrders.reduce((sum, o) => {
        return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      // Unique customers (by phone)
      const uniquePhones = new Set(allOrders.map(o => o.customer_phone));
      const customersToday = uniquePhones.size;

      // Payment methods
      const paymentCounts: Record<string, number> = {};
      validOrders.forEach(o => {
        const method = o.payment_method || 'Não informado';
        paymentCounts[method] = (paymentCounts[method] || 0) + 1;
      });
      
      const paymentColors: Record<string, string> = {
        'Dinheiro': '#F59E0B',
        'Cartão de Crédito': '#3B82F6',
        'Cartão de Débito': '#10B981',
        'PIX': '#8B5CF6',
        'Não informado': '#6B7280',
      };

      const totalPayments = Object.values(paymentCounts).reduce((a, b) => a + b, 0);
      const paymentMethods = Object.entries(paymentCounts).map(([name, count]) => ({
        name,
        value: totalPayments > 0 ? Math.round((count / totalPayments) * 100) : 0,
        color: paymentColors[name] || '#6B7280',
      }));

      // Top products
      const productCounts: Record<string, { count: number; price: number }> = {};
      validOrders.forEach(o => {
        o.items.forEach(item => {
          if (!productCounts[item.productName]) {
            productCounts[item.productName] = { count: 0, price: item.productPrice };
          }
          productCounts[item.productName].count += item.quantity;
        });
      });

      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          price: `R$ ${data.price.toFixed(2).replace('.', ',')}`,
          quantity: `${data.count} un.`,
        }));

      // Peak hours
      const hourlyOrders: Record<number, { count: number; revenue: number }> = {};
      validOrders.forEach(o => {
        const hour = new Date(o.created_at).getHours();
        if (!hourlyOrders[hour]) {
          hourlyOrders[hour] = { count: 0, revenue: 0 };
        }
        hourlyOrders[hour].count++;
        hourlyOrders[hour].revenue += o.total;
      });

      const peakHours = Object.entries(hourlyOrders)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([hour, data]) => ({
          time: `${hour.padStart(2, '0')}:00`,
          orders: `${data.count} pedidos`,
          value: `R$ ${data.revenue.toFixed(2).replace('.', ',')}`,
        }));

      // Hourly chart data
      const hourlyData = Array.from({ length: 8 }, (_, i) => {
        const hour = i * 3;
        const hourData = hourlyOrders[hour] || { revenue: 0 };
        return {
          hour: `${hour}h`,
          value: hourData.revenue,
        };
      });

      // Average table time (mock for now - would need table session tracking)
      const avgTableTime = closedTables > 0 ? 45 : 0; // Placeholder

      return {
        pendingOrders,
        preparingOrders,
        openTables: openTablesCount || 0,
        customersToday,
        totalRevenue,
        totalOrders: validOrders.length,
        avgTicket,
        avgTableTime,
        closedTables,
        deliveryRevenue,
        deliveryOrders: deliveryOrders.length,
        salonRevenue,
        salonOrders: salonOrders.length,
        completedDeliveries,
        cancelRate,
        itemsSold,
        paymentMethods,
        topProducts,
        peakHours,
        hourlyData,
      };
    },
    enabled: !!restaurantId,
    refetchInterval: 60000, // Refetch every minute
  });
};

const getEmptyStats = (): DashboardStats => ({
  pendingOrders: 0,
  preparingOrders: 0,
  openTables: 0,
  customersToday: 0,
  totalRevenue: 0,
  totalOrders: 0,
  avgTicket: 0,
  avgTableTime: 0,
  closedTables: 0,
  deliveryRevenue: 0,
  deliveryOrders: 0,
  salonRevenue: 0,
  salonOrders: 0,
  completedDeliveries: 0,
  cancelRate: 0,
  itemsSold: 0,
  paymentMethods: [],
  topProducts: [],
  peakHours: [],
  hourlyData: [],
});

import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ShoppingBag, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const RestaurantDashboard = () => {
  const { slug } = useParams<{ slug: string }>();

  const stats = [
    { label: 'Pedidos Hoje', value: '23', icon: ShoppingBag, color: 'bg-primary/10 text-primary' },
    { label: 'Em Preparo', value: '5', icon: Clock, color: 'bg-warning/10 text-warning' },
    { label: 'Finalizados', value: '18', icon: CheckCircle, color: 'bg-success/10 text-success' },
    { label: 'Faturamento', value: 'R$ 1.250', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
  ];

  const orders = [
    { id: '101', customer: 'João Silva', items: 2, total: 'R$ 45,80', status: 'pending', time: '2 min' },
    { id: '102', customer: 'Maria Santos', items: 3, total: 'R$ 68,50', status: 'preparing', time: '8 min' },
    { id: '103', customer: 'Pedro Lima', items: 1, total: 'R$ 34,90', status: 'ready', time: '15 min' },
    { id: '104', customer: 'Ana Costa', items: 4, total: 'R$ 92,00', status: 'delivering', time: '22 min' },
  ];

  const statusColors: Record<string, string> = {
    pending: 'delivery-badge-warning',
    preparing: 'delivery-badge-primary',
    ready: 'delivery-badge-success',
    delivering: 'bg-blue-100 text-blue-700',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    preparing: 'Preparando',
    ready: 'Pronto',
    delivering: 'Entregando',
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Gerencie seu restaurante</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="delivery-card p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="delivery-card p-6">
          <h2 className="text-lg font-semibold mb-4">Pedidos Recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Pedido</th>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Itens</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Tempo</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium">#{order.id}</td>
                    <td className="py-4">{order.customer}</td>
                    <td className="py-4">{order.items} itens</td>
                    <td className="py-4 font-medium">{order.total}</td>
                    <td className="py-4">
                      <span className={`delivery-badge ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">{order.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RestaurantDashboard;

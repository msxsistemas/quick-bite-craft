import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, Users, ShoppingBag, TrendingUp } from 'lucide-react';

const ResellerDashboard = () => {
  const stats = [
    { label: 'Restaurantes', value: '12', icon: Store, color: 'bg-primary/10 text-primary' },
    { label: 'Usuários Ativos', value: '48', icon: Users, color: 'bg-success/10 text-success' },
    { label: 'Pedidos Hoje', value: '256', icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
    { label: 'Faturamento', value: 'R$ 8.450', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu sistema</p>
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

        {/* Recent Activity */}
        <div className="delivery-card p-6">
          <h2 className="text-lg font-semibold mb-4">Atividade Recente</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-border last:border-0">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Store className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Novo pedido #10{i}</p>
                  <p className="text-sm text-muted-foreground">Burger House • há {i * 5} minutos</p>
                </div>
                <span className="delivery-badge delivery-badge-success">Confirmado</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerDashboard;

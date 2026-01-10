import { AdminLayout } from '@/components/admin/AdminLayout';
import { Store, Users, ShoppingBag, TrendingUp, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const ResellerDashboard = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/reseller');
  };

  const stats = [
    { label: 'Restaurantes', value: '0', icon: Store, color: 'bg-primary/10 text-primary' },
    { label: 'Usuários Ativos', value: '0', icon: Users, color: 'bg-success/10 text-success' },
    { label: 'Pedidos Hoje', value: '0', icon: ShoppingBag, color: 'bg-warning/10 text-warning' },
    { label: 'Faturamento', value: 'R$ 0', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
  ];

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {profile?.name || 'Revendedor'}! 👋
            </h1>
            <p className="text-muted-foreground">Visão geral do seu sistema</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
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

        {/* Empty State */}
        <div className="delivery-card p-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhum restaurante cadastrado
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Comece criando seu primeiro restaurante para gerenciar cardápios, pedidos e muito mais.
          </p>
          <button className="delivery-btn-primary max-w-xs">
            Criar Restaurante
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerDashboard;

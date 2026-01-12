import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DollarSign, AlertTriangle, CheckCircle, Search, Calendar, Store } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRestaurantSubscriptions } from '@/hooks/useRestaurantSubscriptions';

const ResellerSubscriptionsPage = () => {
  const { restaurants, payments, isLoading, getStats } = useRestaurantSubscriptions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = getStats();

  const statCards = [
    { 
      label: 'Receita Mensal', 
      value: `R$ ${stats.monthlyRevenue.toFixed(2).replace('.', ',')}`, 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      label: 'Pendentes', 
      value: `R$ ${stats.pendingAmount.toFixed(2).replace('.', ',')}`, 
      subtext: `${stats.pendingPayments} pagamentos`,
      icon: AlertTriangle, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      label: 'Atrasados', 
      value: `R$ ${stats.overdueAmount.toFixed(2).replace('.', ',')}`, 
      subtext: `${stats.overduePayments} pagamentos`,
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-600' 
    },
    { 
      label: 'Recebidos', 
      value: `R$ ${stats.paidAmount.toFixed(2).replace('.', ',')}`, 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-600' 
    },
  ];

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.restaurant_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Pago</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">Pendente</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Atrasado</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{status}</span>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout type="reseller">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="reseller">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mensalidades</h1>
          <p className="text-muted-foreground">Gerencie os pagamentos dos seus restaurantes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="delivery-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  {stat.subtext && (
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.subtext}</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="delivery-card p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por restaurante..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
                <SelectItem value="paid">Recebidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment History */}
        <div className="delivery-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Histórico de Pagamentos</h2>
          
          {filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{payment.restaurant_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Venc: {new Date(payment.due_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        R$ {payment.amount.toFixed(2).replace('.', ',')}
                      </p>
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscriptions by Restaurant */}
        <div className="delivery-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Assinaturas por Restaurante</h2>
          
          {restaurants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Nenhum restaurante cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <div key={restaurant.id} className="flex items-center justify-between p-4 border border-border rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground">/{restaurant.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        R$ {(restaurant.subscription?.monthly_fee || 0).toFixed(2).replace('.', ',')}/mês
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        restaurant.subscription?.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : restaurant.subscription?.status === 'trial'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {restaurant.subscription?.status === 'active' 
                          ? 'Ativo' 
                          : restaurant.subscription?.status === 'trial'
                          ? 'Em Teste'
                          : 'Sem Assinatura'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerSubscriptionsPage;

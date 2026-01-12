import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DollarSign, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ResellerSubscriptionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const stats = [
    { 
      label: 'Receita Mensal', 
      value: 'R$ 149.90', 
      icon: DollarSign, 
      color: 'bg-green-100 text-green-600' 
    },
    { 
      label: 'Pendentes', 
      value: 'R$ 0.00', 
      subtext: '0 pagamentos',
      icon: AlertTriangle, 
      color: 'bg-yellow-100 text-yellow-600' 
    },
    { 
      label: 'Atrasados', 
      value: 'R$ 0.00', 
      subtext: '0 pagamentos',
      icon: AlertTriangle, 
      color: 'bg-red-100 text-red-600' 
    },
    { 
      label: 'Recebidos', 
      value: 'R$ 0.00', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-600' 
    },
  ];

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
          {stats.map((stat) => (
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
          
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ResellerSubscriptionsPage;

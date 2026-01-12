import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { 
  Package, 
  DollarSign, 
  CheckCircle, 
  TrendingUp,
  Calendar,
  ChevronDown,
  LayoutGrid,
  BarChart3
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = 'kanban' | 'stats';

interface OrderColumn {
  id: string;
  title: string;
  count: number;
  bgColor: string;
  textColor: string;
  orders: any[];
}

const OrdersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [dateFilter, setDateFilter] = useState('today');

  const dateFilterOptions = [
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
  ];

  const statsCards = [
    { icon: Package, label: 'Total Pedidos', value: '0', bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
    { icon: DollarSign, label: 'Receita', value: 'R$ 0,00', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: CheckCircle, label: 'Finalizados', value: '0', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: TrendingUp, label: 'Ticket Médio', value: 'R$ 0,00', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  ];

  const orderColumns: OrderColumn[] = [
    { id: 'pending', title: 'Pendentes', count: 0, bgColor: 'bg-amber-50', textColor: 'text-amber-700', orders: [] },
    { id: 'preparing', title: 'Em Preparo', count: 0, bgColor: 'bg-orange-50', textColor: 'text-orange-700', orders: [] },
    { id: 'delivery', title: 'Saiu p/ Entrega', count: 0, bgColor: 'bg-blue-50', textColor: 'text-blue-700', orders: [] },
    { id: 'completed', title: 'Finalizados', count: 0, bgColor: 'bg-green-50', textColor: 'text-green-700', orders: [] },
  ];

  const getBadgeColor = (id: string) => {
    switch (id) {
      case 'pending': return 'bg-blue-500';
      case 'preparing': return 'bg-orange-500';
      case 'delivery': return 'bg-cyan-500';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium bg-card">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {dateFilterOptions.find(opt => opt.value === dateFilter)?.label}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {dateFilterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setDateFilter(option.value)}
                  className={dateFilter === option.value ? 'bg-amber-100 text-amber-900' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-amber-500 text-white'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'stats'
                  ? 'bg-amber-500 text-white'
                  : 'border border-border hover:bg-muted'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`w-10 h-10 ${card.bgColor} rounded-full flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-4">
          {orderColumns.map((column) => (
            <div
              key={column.id}
              className={`${column.bgColor} rounded-xl p-4 min-h-[300px]`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${column.textColor}`}>{column.title}</h3>
                <span className={`w-6 h-6 ${getBadgeColor(column.id)} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                  {column.count}
                </span>
              </div>
              
              {column.orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pedido
                </p>
              ) : (
                <div className="space-y-3">
                  {column.orders.map((order: any) => (
                    <div key={order.id} className="bg-card p-3 rounded-lg shadow-sm">
                      {/* Order card content */}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;

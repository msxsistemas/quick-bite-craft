import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Filter, Clock, Settings, Plus, Users } from 'lucide-react';

type TableStatus = 'all' | 'free' | 'occupied' | 'requesting' | 'reserved';

interface Table {
  id: number;
  name: string;
  description: string;
  capacity: number;
  status: 'free' | 'occupied' | 'requesting' | 'reserved';
}

const PDVPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [filter, setFilter] = useState<TableStatus>('all');

  const mockTables: Table[] = [
    { id: 1, name: 'Mesa 1', description: 'Mesa 1', capacity: 4, status: 'free' },
    { id: 2, name: 'Mesa 2', description: 'Mesa 2', capacity: 4, status: 'free' },
    { id: 3, name: 'Mesa 3', description: 'Mesa 3', capacity: 6, status: 'free' },
    { id: 4, name: 'Mesa 4', description: 'Mesa 4', capacity: 2, status: 'free' },
    { id: 5, name: 'Mesa 5', description: 'Mesa 5', capacity: 8, status: 'free' },
    { id: 6, name: 'Mesa 6', description: 'Mesa 6', capacity: 4, status: 'free' },
    { id: 7, name: 'Mesa 7', description: 'Mesa 7', capacity: 4, status: 'free' },
    { id: 8, name: 'Mesa 8', description: 'Mesa Vip', capacity: 4, status: 'free' },
  ];

  const statusCounts = {
    all: mockTables.length,
    free: mockTables.filter(t => t.status === 'free').length,
    occupied: mockTables.filter(t => t.status === 'occupied').length,
    requesting: mockTables.filter(t => t.status === 'requesting').length,
    reserved: mockTables.filter(t => t.status === 'reserved').length,
  };

  const filteredTables = filter === 'all' 
    ? mockTables 
    : mockTables.filter(t => t.status === filter);

  const statusCards = [
    { label: 'Livres', count: statusCounts.free, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', borderColor: 'border-yellow-400' },
    { label: 'Ocupadas', count: statusCounts.occupied, bgColor: 'bg-green-100', textColor: 'text-green-600', borderColor: 'border-green-400' },
    { label: 'Pedindo Conta', count: statusCounts.requesting, bgColor: 'bg-orange-100', textColor: 'text-orange-600', borderColor: 'border-orange-400' },
    { label: 'Reservadas', count: statusCounts.reserved, bgColor: 'bg-blue-100', textColor: 'text-blue-600', borderColor: 'border-blue-400' },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-green-100 text-green-700 border border-green-300';
      case 'occupied': return 'bg-red-100 text-red-700 border border-red-300';
      case 'requesting': return 'bg-orange-100 text-orange-700 border border-orange-300';
      case 'reserved': return 'bg-blue-100 text-blue-700 border border-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'free': return 'Livre';
      case 'occupied': return 'Ocupada';
      case 'requesting': return 'Pedindo Conta';
      case 'reserved': return 'Reservada';
      default: return status;
    }
  };

  const getTableBorderColor = (status: string) => {
    switch (status) {
      case 'free': return 'border-green-300 bg-green-50/50';
      case 'occupied': return 'border-red-300 bg-red-50/50';
      case 'requesting': return 'border-orange-300 bg-orange-50/50';
      case 'reserved': return 'border-blue-300 bg-blue-50/50';
      default: return 'border-border';
    }
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mapa de Mesas</h1>
            <p className="text-muted-foreground">Gerencie mesas e pedidos do salão</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <Clock className="w-4 h-4" />
              Histórico
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium">
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              Nova Mesa
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-4 border-b border-border pb-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {[
            { key: 'all', label: `Todas (${statusCounts.all})` },
            { key: 'free', label: `Livres (${statusCounts.free})` },
            { key: 'occupied', label: `Ocupadas (${statusCounts.occupied})` },
            { key: 'requesting', label: `Pedindo Conta (${statusCounts.requesting})` },
            { key: 'reserved', label: `Reservadas (${statusCounts.reserved})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as TableStatus)}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                filter === tab.key
                  ? 'text-amber-600 border-amber-500'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-4 gap-4">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-6 text-center border-2 ${card.borderColor}`}
            >
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.count}</p>
              <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-5 gap-4">
          {filteredTables.map((table) => (
            <div
              key={table.id}
              className={`border-2 rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${getTableBorderColor(table.status)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-foreground">{table.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(table.status)}`}>
                  {getStatusLabel(table.status)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{table.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Capacidade: {table.capacity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default PDVPage;

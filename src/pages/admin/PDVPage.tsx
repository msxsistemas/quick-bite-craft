import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Filter, Clock, Settings, Plus, Users, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWaiters } from '@/hooks/useWaiters';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { formatCurrency } from '@/lib/format';

type TableStatus = 'all' | 'free' | 'occupied' | 'requesting' | 'reserved';

interface Table {
  id: number;
  name: string;
  description: string;
  capacity: number;
  status: 'free' | 'occupied' | 'requesting' | 'reserved';
  waiterId?: string;
  tipAmount?: number;
}

const PDVPage = () => {
const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug || '');
  const { waiters } = useWaiters(restaurant?.id);
  
  const [filter, setFilter] = useState<TableStatus>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);

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

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setSelectedWaiterId(table.waiterId || '');
    setTipAmount(table.tipAmount?.toString() || '0');
    setTipPercentage(null);
    setIsModalOpen(true);
  };

  const handleTipPercentageClick = (percentage: number, orderTotal: number = 100) => {
    setTipPercentage(percentage);
    const calculatedTip = (orderTotal * percentage) / 100;
    setTipAmount(calculatedTip.toFixed(2));
  };

  const handleSaveTableSettings = () => {
    // Here you would save the waiter and tip to the order
    console.log('Saving table settings:', {
      tableId: selectedTable?.id,
      waiterId: selectedWaiterId,
      tipAmount: parseFloat(tipAmount) || 0,
    });
    setIsModalOpen(false);
  };

  const activeWaiters = waiters?.filter(w => w.active) || [];

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie mesas e pedidos do salão</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Clock className="w-4 h-4" />
              Histórico
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="w-4 h-4" />
              Gerenciar
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Mesa
            </Button>
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
              onClick={() => handleTableClick(table)}
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

      {/* Table Order Modal with Waiter & Tip */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedTable?.name} - Configurações
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Waiter Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Garçom Responsável
              </Label>
              <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um garçom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {activeWaiters.map((waiter) => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeWaiters.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum garçom ativo. Adicione garçons na página de Garçons.
                </p>
              )}
            </div>

            {/* Tip Amount */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Gorjeta
              </Label>
              
              {/* Quick Tip Percentages */}
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((percentage) => (
                  <Button
                    key={percentage}
                    type="button"
                    variant={tipPercentage === percentage ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTipPercentageClick(percentage)}
                    className="flex-1"
                  >
                    {percentage}%
                  </Button>
                ))}
              </div>
              
              {/* Manual Tip Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tipAmount}
                  onChange={(e) => {
                    setTipAmount(e.target.value);
                    setTipPercentage(null);
                  }}
                  className="pl-10"
                  placeholder="0,00"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A gorjeta será vinculada ao garçom selecionado
              </p>
            </div>

            {/* Summary */}
            {selectedWaiterId && parseFloat(tipAmount) > 0 && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium">Resumo</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Garçom:</span>
                    <span>{activeWaiters.find(w => w.id === selectedWaiterId)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gorjeta:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(parseFloat(tipAmount) || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSaveTableSettings} className="flex-1">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PDVPage;

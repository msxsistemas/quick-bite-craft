import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Loader2, Menu, X, Settings, Users, Trophy, 
  HelpCircle, LogOut, Plus, Search, Rocket, QrCode,
  Printer, DollarSign, Eye
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters } from '@/hooks/useWaiters';
import { useTables, Table } from '@/hooks/useTables';
import { useOrders, useOrderById, OrderItem } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { CloseBillModal } from '@/components/pdv/CloseBillModal';
import { AddItemsModal } from '@/components/pdv/AddItemsModal';

interface Waiter {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug || '');
  const { waiters, isLoading: waitersLoading } = useWaiters(restaurant?.id);
  const { tables, refetch: refetchTables, createTable } = useTables(restaurant?.id);
  const { data: orders } = useOrders(restaurant?.id);
  const { products } = useProducts(restaurant?.id);
  const { categories } = useCategories(restaurant?.id);
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>('mesas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCloseBillModalOpen, setIsCloseBillModalOpen] = useState(false);
  const [isClosingBill, setIsClosingBill] = useState(false);
  const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);

  const activeWaiters = waiters?.filter(w => w.active) || [];

  // Get current order for selected table
  const tableOrder = orders?.find(o => 
    o.table_id === selectedTable?.id && 
    ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
  );

  const { data: currentOrder, refetch: refetchCurrentOrder } = useOrderById(tableOrder?.id);

  // Calculate order total for a table
  const getTableTotal = (tableId: string) => {
    const tableOrders = orders?.filter(o => 
      o.table_id === tableId && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    ) || [];
    return tableOrders.reduce((sum, o) => sum + o.total, 0);
  };

  // Filter tables based on search
  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get table status color classes
  const getTableStyles = (table: Table) => {
    const hasOrder = orders?.some(o => 
      o.table_id === table.id && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    );
    
    if (table.status === 'requesting') {
      return 'bg-amber-500 border-amber-400';
    }
    if (table.status === 'occupied' || hasOrder) {
      return 'bg-red-500 border-red-400';
    }
    return 'bg-slate-700 border-slate-600';
  };

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsTableModalOpen(true);
  };

  const handleCreateTable = async () => {
    if (isCreatingTable) return;
    setIsCreatingTable(true);
    try {
      const nextNumber = tables.length + 1;
      await createTable.mutateAsync({
        name: `Mesa ${nextNumber}`,
        capacity: 4,
      });
    } finally {
      setIsCreatingTable(false);
    }
  };

  const handleNewOrder = async () => {
    if (!selectedTable || !restaurant || !selectedWaiter) return;
    
    setIsCreatingOrder(true);
    try {
      // First, open the table
      await supabase
        .from('tables')
        .update({ 
          status: 'occupied',
          current_waiter_id: selectedWaiter.id 
        })
        .eq('id', selectedTable.id);

      // Then open add items modal
      setIsTableModalOpen(false);
      setIsAddItemsModalOpen(true);
    } catch (error) {
      toast.error('Erro ao abrir mesa');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleOpenCloseBill = () => {
    setIsTableModalOpen(false);
    setIsCloseBillModalOpen(true);
  };

  const handleConfirmPayment = async (paymentMethod: string, tipAmount: number) => {
    if (!currentOrder || !selectedTable) return;
    
    setIsClosingBill(true);
    try {
      // Update order with tip and mark as delivered
      await supabase
        .from('orders')
        .update({ 
          status: 'delivered',
          payment_method: paymentMethod,
          tip_amount: tipAmount,
          delivered_at: new Date().toISOString()
        })
        .eq('id', currentOrder.id);

      // Free the table
      await supabase
        .from('tables')
        .update({ 
          status: 'free',
          current_order_id: null,
          current_waiter_id: null
        })
        .eq('id', selectedTable.id);

      toast.success('Conta fechada com sucesso!');
      setIsCloseBillModalOpen(false);
      setSelectedTable(null);
      refetchTables();
    } catch (error) {
      toast.error('Erro ao fechar conta');
    } finally {
      setIsClosingBill(false);
    }
  };

  const handleConfirmAddItems = async (items: OrderItem[]) => {
    if (!restaurant || !selectedTable || !selectedWaiter) return;
    
    setIsAddingItems(true);
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
      
      if (currentOrder) {
        // Add to existing order
        const existingItems = currentOrder.items || [];
        const mergedItems = [...existingItems];
        
        items.forEach(newItem => {
          const existingIndex = mergedItems.findIndex(
            (ei: any) => ei.productId === newItem.productId
          );
          if (existingIndex >= 0) {
            mergedItems[existingIndex].quantity += newItem.quantity;
          } else {
            mergedItems.push(newItem);
          }
        });
        
        const newSubtotal = mergedItems.reduce(
          (sum: number, item: any) => sum + (item.productPrice * item.quantity), 0
        );
        
        await supabase
          .from('orders')
          .update({
            items: mergedItems as any,
            subtotal: newSubtotal,
            total: newSubtotal
          })
          .eq('id', currentOrder.id);
        
        toast.success('Itens adicionados ao pedido!');
      } else {
        // Create new order
        const orderItems = items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          extras: []
        }));

        await supabase
          .from('orders')
          .insert({
            restaurant_id: restaurant.id,
            table_id: selectedTable.id,
            waiter_id: selectedWaiter.id,
            customer_name: selectedTable.name,
            customer_phone: '00000000000',
            items: orderItems as any,
            subtotal: subtotal,
            total: subtotal,
            status: 'pending',
            payment_method: 'pending'
          });
        
        toast.success('Pedido criado com sucesso!');
      }
      
      setIsAddItemsModalOpen(false);
      refetchTables();
      refetchCurrentOrder();
    } catch (error) {
      toast.error('Erro ao adicionar itens');
    } finally {
      setIsAddingItems(false);
    }
  };

  if (restaurantLoading || waitersLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Waiter selection screen
  if (!selectedWaiter) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-[#0d2847] border border-[#1e4976] rounded-2xl p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              {restaurant?.logo ? (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🍔</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Olá, Garçom!</h1>
              <p className="text-slate-400">Selecione seu nome para acessar</p>
              {restaurant?.name && (
                <p className="text-sm text-cyan-400 font-medium mt-2">{restaurant.name}</p>
              )}
            </div>

            {/* Waiter List */}
            {activeWaiters.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-slate-500 mb-4" />
                <p className="text-slate-400">Nenhum garçom cadastrado</p>
                <p className="text-sm text-slate-500 mt-2">
                  Peça ao administrador para cadastrar garçons
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeWaiters.map((waiter) => (
                  <button
                    key={waiter.id}
                    onClick={() => setSelectedWaiter(waiter)}
                    className="w-full flex items-center gap-4 p-4 bg-[#0a1628] border border-[#1e4976] rounded-xl hover:border-cyan-500 hover:bg-[#0d2040] transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="font-medium text-white">{waiter.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main waiter dashboard
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="relative p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
          </button>
          <h1 className="text-white font-semibold">Mapa de mesas e comandas</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-[#0d2847] flex">
        <button
          onClick={() => setActiveTab('mesas')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'mesas' 
              ? 'bg-cyan-500 text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Mesas
        </button>
        <button
          onClick={() => setActiveTab('comandas')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'comandas' 
              ? 'bg-cyan-500 text-white' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Comandas
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={activeTab === 'mesas' ? 'Buscar por nome da mesa' : 'Buscar por nº ou identificador'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-[#0d2847] border-[#1e4976] text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-4 pb-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-slate-500 bg-transparent"></span>
          <span className="text-slate-400">Livres</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-slate-400">Ocupadas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-400">Em pagamento</span>
        </div>
      </div>

      {/* Tables/Commands Grid */}
      <div className="flex-1 px-4 pb-24">
        <div className="grid grid-cols-3 gap-3">
          {filteredTables.map(table => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`aspect-square rounded-xl p-3 border-2 flex flex-col justify-start items-start text-left transition-all hover:opacity-80 ${getTableStyles(table)}`}
            >
              <span className="text-white font-bold text-lg">{table.name}</span>
              {getTableTotal(table.id) > 0 && (
                <span className="text-white/80 text-xs mt-1">
                  {formatCurrency(getTableTotal(table.id))}
                </span>
              )}
            </button>
          ))}
          
          {/* Create Table Button */}
          <button
            onClick={handleCreateTable}
            disabled={isCreatingTable}
            className="aspect-square rounded-xl p-3 border-2 border-dashed border-[#1e4976] flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
          >
            {isCreatingTable ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <Plus className="w-8 h-8 mb-1" />
                <span className="text-sm">Criar mesas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1628]">
        <button className="w-full py-4 bg-[#0d2847] border-2 border-[#1e4976] rounded-xl text-cyan-400 font-medium flex items-center justify-center gap-2 hover:border-cyan-500 transition-colors">
          <Rocket className="w-5 h-5" />
          Delivery/Para Levar
        </button>
      </div>

      {/* Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-80 bg-[#0d2847] border-r-[#1e4976] p-0">
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#1e4976] flex items-center justify-between">
              <h2 className="text-white font-semibold">Mapa de mesas e comandas</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Menu */}
            <nav className="flex-1 py-2">
              <button className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors">
                <Settings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
              <button className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors">
                <Users className="w-5 h-5" />
                <span>Meus garçons</span>
              </button>
              <button className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors">
                <Trophy className="w-5 h-5" />
                <span>Desafios Garçom</span>
              </button>
            </nav>

            {/* Sidebar Footer */}
            <div className="border-t border-[#1e4976]">
              <button className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors">
                <HelpCircle className="w-5 h-5" />
                <span>Ajuda</span>
              </button>
              
              <div className="px-4 py-3 flex items-center gap-3 border-t border-[#1e4976]">
                {restaurant?.logo ? (
                  <img src={restaurant.logo} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <span className="text-lg">🍔</span>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-400">{selectedWaiter.name},</p>
                  <p className="text-white font-medium">{restaurant?.name}</p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedWaiter(null)}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 text-cyan-400 bg-[#0a1628] hover:bg-[#0d2040] transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Table Modal */}
      <Dialog open={isTableModalOpen} onOpenChange={setIsTableModalOpen}>
        <DialogContent className="bg-white rounded-2xl p-6 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{selectedTable?.name}</h2>
            <button onClick={() => setIsTableModalOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {tableOrder && (
            <div className="flex items-center gap-2 mb-6 text-gray-700">
              <DollarSign className="w-5 h-5" />
              <span>Conta: <strong>{formatCurrency(getTableTotal(selectedTable?.id || ''))}</strong> (c/ taxa)</span>
            </div>
          )}

          <div className="space-y-3">
            {tableOrder && (
              <>
                <button 
                  onClick={() => {
                    setIsTableModalOpen(false);
                    // TODO: Navigate to order details
                  }}
                  className="w-full py-3 px-4 border-2 border-[#1e4976] rounded-xl text-[#1e4976] font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <QrCode className="w-5 h-5" />
                  Ver pedidos
                </button>
                <button className="w-full py-3 px-4 border-2 border-[#1e4976] rounded-xl text-[#1e4976] font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
                  <Printer className="w-5 h-5" />
                  Imprimir conferência
                </button>
                <button 
                  onClick={handleOpenCloseBill}
                  className="w-full py-3 px-4 border-2 border-[#1e4976] rounded-xl text-[#1e4976] font-medium flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
                >
                  <DollarSign className="w-5 h-5" />
                  Fechar conta
                </button>
              </>
            )}
            <button 
              onClick={tableOrder ? () => {
                setIsTableModalOpen(false);
                setIsAddItemsModalOpen(true);
              } : handleNewOrder}
              disabled={isCreatingOrder}
              className="w-full py-3 px-4 bg-[#0066CC] rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0055AA] transition-colors disabled:opacity-50"
            >
              {isCreatingOrder ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {tableOrder ? 'Adicionar itens' : 'Novo pedido'}
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Bill Modal */}
      <CloseBillModal
        isOpen={isCloseBillModalOpen}
        onClose={() => setIsCloseBillModalOpen(false)}
        order={currentOrder || null}
        tableName={selectedTable?.name || ''}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isClosingBill}
      />

      {/* Add Items Modal */}
      {currentOrder && (
        <AddItemsModal
          isOpen={isAddItemsModalOpen}
          onClose={() => setIsAddItemsModalOpen(false)}
          order={currentOrder}
          tableName={selectedTable?.name || ''}
          products={products}
          categories={categories}
          onConfirmAddItems={handleConfirmAddItems}
          isProcessing={isAddingItems}
        />
      )}
    </div>
  );
};

export default WaiterAccessPage;

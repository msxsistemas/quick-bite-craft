import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, Loader2, Menu, X, Settings, Users, Trophy, 
  HelpCircle, LogOut, Plus, Search, Rocket, QrCode,
  Printer, DollarSign, ShoppingCart
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters } from '@/hooks/useWaiters';
import { useTables, Table } from '@/hooks/useTables';
import { useOrders, Order, OrderItem } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WaiterOrdersView } from '@/components/waiter/WaiterOrdersView';
import { WaiterProductsView } from '@/components/waiter/WaiterProductsView';
import { WaiterCartView } from '@/components/waiter/WaiterCartView';
import { WaiterCloseBillView } from '@/components/waiter/WaiterCloseBillView';

interface Waiter {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  image_url?: string | null;
}

type ViewMode = 'map' | 'orders' | 'products' | 'cart' | 'closeBill';

const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug || '');
  const { waiters, isLoading: waitersLoading } = useWaiters(restaurant?.id);
  const { tables, refetch: refetchTables, createTable } = useTables(restaurant?.id);
  const { data: orders, refetch: refetchOrders } = useOrders(restaurant?.id);
  const { products } = useProducts(restaurant?.id);
  const { categories } = useCategories(restaurant?.id);
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>('mesas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const activeWaiters = waiters?.filter(w => w.active) || [];

  // Get orders for selected table
  const getTableOrders = (tableId: string): Order[] => {
    return orders?.filter(o => 
      o.table_id === tableId && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    ) || [];
  };

  const tableOrders = selectedTable ? getTableOrders(selectedTable.id) : [];

  // Check if table has pending orders (shopping cart icon)
  const hasTablePendingOrder = (tableId: string): boolean => {
    return orders?.some(o => 
      o.table_id === tableId && 
      o.status === 'pending'
    ) || false;
  };

  // Calculate order total for a table
  const getTableTotal = (tableId: string) => {
    const tableOrders = getTableOrders(tableId);
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
      return 'bg-amber-600 border-amber-500';
    }
    if (table.status === 'occupied' || hasOrder) {
      return 'bg-red-700 border-red-600';
    }
    return 'bg-[#1e3a5f] border-[#2a4a6f]';
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

  const handleViewOrders = () => {
    setIsTableModalOpen(false);
    setViewMode('orders');
  };

  const handleNewOrder = async () => {
    if (!selectedTable || !restaurant || !selectedWaiter) return;
    
    try {
      // First, open the table
      await supabase
        .from('tables')
        .update({ 
          status: 'occupied',
          current_waiter_id: selectedWaiter.id 
        })
        .eq('id', selectedTable.id);

      setIsTableModalOpen(false);
      setCart([]);
      setViewMode('products');
    } catch (error) {
      toast.error('Erro ao abrir mesa');
    }
  };

  const handleOpenCloseBill = () => {
    setIsTableModalOpen(false);
    setViewMode('closeBill');
  };

  const handleSelectProduct = (product: any) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        image_url: product.image_url,
      }]);
    }
    setViewMode('cart');
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
    } else {
      setCart(cart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const handleConfirmOrder = async () => {
    if (!selectedTable || !restaurant || !selectedWaiter || cart.length === 0) return;

    setIsProcessing(true);
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
      
      const orderItems = cart.map(item => ({
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
      setCart([]);
      setViewMode('map');
      refetchTables();
      refetchOrders();
    } catch (error) {
      toast.error('Erro ao criar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async (method: string, amount: number) => {
    // Payment logic - just showing confirmation for now
    toast.success(`Pagamento de ${formatCurrency(amount)} via ${method} registrado!`);
  };

  const handleMarkDelivered = async (orderId: string, delivered: boolean) => {
    try {
      await supabase
        .from('orders')
        .update({ 
          status: delivered ? 'ready' : 'preparing'
        })
        .eq('id', orderId);
      refetchOrders();
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  const handleBackToMap = () => {
    setViewMode('map');
    setSelectedTable(null);
    setCart([]);
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

            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Olá, Garçom!</h1>
              <p className="text-slate-400">Selecione seu nome para acessar</p>
              {restaurant?.name && (
                <p className="text-sm text-cyan-400 font-medium mt-2">{restaurant.name}</p>
              )}
            </div>

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

  // View: Orders List
  if (viewMode === 'orders' && selectedTable) {
    return (
      <WaiterOrdersView
        tableName={selectedTable.name}
        orders={tableOrders}
        onBack={() => setViewMode('map')}
        onPrint={() => toast.info('Imprimindo...')}
        onNewOrder={() => {
          setCart([]);
          setViewMode('products');
        }}
        onCloseBill={() => setViewMode('closeBill')}
        onMarkDelivered={handleMarkDelivered}
      />
    );
  }

  // View: Products Selection
  if (viewMode === 'products' && selectedTable) {
    return (
      <WaiterProductsView
        tableName={selectedTable.name}
        products={products}
        categories={categories}
        onBack={() => cart.length > 0 ? setViewMode('cart') : setViewMode('map')}
        onSelectProduct={handleSelectProduct}
      />
    );
  }

  // View: Cart
  if (viewMode === 'cart' && selectedTable) {
    return (
      <WaiterCartView
        tableName={selectedTable.name}
        items={cart}
        onBack={() => setViewMode('products')}
        onClearCart={() => setCart([])}
        onAddItems={() => setViewMode('products')}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onConfirmOrder={handleConfirmOrder}
        isProcessing={isProcessing}
      />
    );
  }

  // View: Close Bill
  if (viewMode === 'closeBill' && selectedTable) {
    return (
      <WaiterCloseBillView
        tableName={selectedTable.name}
        orders={tableOrders}
        onBack={() => setViewMode('map')}
        onGoToMap={handleBackToMap}
        onPrint={() => toast.info('Imprimindo...')}
        onConfirmPayment={handleConfirmPayment}
      />
    );
  }

  // Main Table Map View
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
      <div className="flex">
        <button
          onClick={() => setActiveTab('mesas')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'mesas' 
              ? 'bg-cyan-500 text-white' 
              : 'bg-[#0d2847] text-slate-400 hover:text-white'
          }`}
        >
          Mesas
        </button>
        <button
          onClick={() => setActiveTab('comandas')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'comandas' 
              ? 'bg-cyan-500 text-white' 
              : 'bg-[#0d2847] text-slate-400 hover:text-white'
          }`}
        >
          Comandas
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-[#0d2847]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={activeTab === 'mesas' ? 'Buscar por nome da mesa' : 'Buscar por nº ou identificador'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-[#0a1628] border-[#1e4976] text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-4 py-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-slate-500 bg-transparent"></span>
          <span className="text-slate-400">Livres</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-600"></span>
          <span className="text-slate-400">Ocupadas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-400">Em pagamento</span>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="flex-1 px-4 pb-24">
        <div className="grid grid-cols-3 gap-3">
          {filteredTables.map(table => {
            const hasOrder = getTableOrders(table.id).length > 0;
            const hasPendingOrder = hasTablePendingOrder(table.id);
            
            return (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`aspect-[4/3] rounded-xl p-3 border-2 flex flex-col justify-between items-start text-left transition-all hover:opacity-80 relative ${getTableStyles(table)}`}
              >
                <span className="text-white font-bold text-lg">{table.name}</span>
                {hasPendingOrder && (
                  <div className="absolute bottom-3 right-3 text-white/70">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                )}
              </button>
            );
          })}
          
          {/* Create Table Button */}
          <button
            onClick={handleCreateTable}
            disabled={isCreatingTable}
            className="aspect-[4/3] rounded-xl p-3 border-2 border-dashed border-[#1e4976] flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
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
            <div className="p-4 border-b border-[#1e4976] flex items-center justify-between">
              <h2 className="text-white font-semibold">Mapa de mesas e comandas</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

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

      {/* Table Modal (Bottom Sheet Style) */}
      {isTableModalOpen && selectedTable && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsTableModalOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{selectedTable.name}</h2>
              <button 
                onClick={() => setIsTableModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {tableOrders.length > 0 && (
              <div className="flex items-center gap-2 mb-6 text-gray-700">
                <DollarSign className="w-5 h-5" />
                <span>Conta: <strong>{formatCurrency(getTableTotal(selectedTable.id))}</strong> (c/ taxa)</span>
              </div>
            )}

            <div className="space-y-3">
              {tableOrders.length > 0 && (
                <>
                  <button 
                    onClick={handleViewOrders}
                    className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                  >
                    <QrCode className="w-5 h-5" />
                    Ver pedidos
                  </button>
                  <button className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                    <Printer className="w-5 h-5" />
                    Imprimir conferência
                  </button>
                  <button 
                    onClick={handleOpenCloseBill}
                    className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                  >
                    <DollarSign className="w-5 h-5" />
                    Fechar conta
                  </button>
                </>
              )}
              <button 
                onClick={handleNewOrder}
                className="w-full py-3 px-4 bg-[#0066CC] rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0055AA] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterAccessPage;

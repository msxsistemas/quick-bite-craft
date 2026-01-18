import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, Loader2, Menu, X, Settings, Users, Trophy, 
  LogOut, Plus, Search, Rocket, QrCode,
  Printer, DollarSign, ShoppingCart, Truck, Package,
  ChevronRight, Smartphone, MessageSquare
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters } from '@/hooks/useWaiters';
import { useTables, Table } from '@/hooks/useTables';
import { useOrders, Order, OrderItem } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { WaiterOrdersView } from '@/components/waiter/WaiterOrdersView';
import { WaiterProductsView } from '@/components/waiter/WaiterProductsView';
import { WaiterCartView } from '@/components/waiter/WaiterCartView';
import { WaiterCloseBillView } from '@/components/waiter/WaiterCloseBillView';
import { CreateTablesModal } from '@/components/waiter/CreateTablesModal';
import { DeliveryCustomerView } from '@/components/waiter/DeliveryCustomerView';
import { DeliveryOptionsView } from '@/components/waiter/DeliveryOptionsView';
import { DeliveryAddressView } from '@/components/waiter/DeliveryAddressView';
import { WaiterSettingsView } from '@/components/waiter/WaiterSettingsView';
import { WaiterListView } from '@/components/waiter/WaiterListView';
import { WaiterChallengesView } from '@/components/waiter/WaiterChallengesView';
import { WaiterSettingsProvider, useWaiterSettingsContext } from '@/contexts/WaiterSettingsContext';
import { TableCard } from '@/components/waiter/TableCard';
import { ComandaCard } from '@/components/waiter/ComandaCard';
import { CreateComandasModal } from '@/components/waiter/CreateComandasModal';
import { ComandaCustomerView } from '@/components/waiter/ComandaCustomerView';

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

// Comanda type is now imported from useComandas hook

interface DeliveryAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
  complement?: string;
}

interface DeliveryCustomer {
  name: string;
  phone: string;
}

type ViewMode = 'map' | 'orders' | 'products' | 'cart' | 'closeBill' | 'deliveryCustomer' | 'deliveryOptions' | 'deliveryAddress' | 'deliveryProducts' | 'deliveryCart' | 'settings' | 'waiterList' | 'challenges' | 'comandaOrders' | 'comandaProducts' | 'comandaCart' | 'comandaCloseBill' | 'comandaCustomer';

const WaiterAccessPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug || '');
  const { waiters, isLoading: waitersLoading, createWaiter, updateWaiter, deleteWaiter, toggleWaiterStatus } = useWaiters(restaurant?.id);
  const { tables, refetch: refetchTables, createTable, updateTableStatus } = useTables(restaurant?.id);
  const { data: orders, refetch: refetchOrders } = useOrders(restaurant?.id);
  const { products } = useProducts(restaurant?.id);
  const { categories } = useCategories(restaurant?.id);
  const { comandas, createComanda, updateComanda, closeComanda, getNextNumber, isLoading: comandasLoading, refetch: refetchComandas } = useComandas(restaurant?.id);
  const { defaultTab, notificationSoundEnabled } = useWaiterSettingsContext();
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [isCreateTablesModalOpen, setIsCreateTablesModalOpen] = useState(false);
  const [isCreateComandasModalOpen, setIsCreateComandasModalOpen] = useState(false);
  const [isCreatingComandas, setIsCreatingComandas] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [comandaCart, setComandaCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [isComandaModalOpen, setIsComandaModalOpen] = useState(false);
  const [isSavingComandaCustomer, setIsSavingComandaCustomer] = useState(false);
  
  // Suggestion modal states
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionRating, setSuggestionRating] = useState<number | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  
  // PWA install prompt
  const deferredPromptRef = useRef<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  
  // Delivery states
  const [deliveryCustomer, setDeliveryCustomer] = useState<DeliveryCustomer | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryCart, setDeliveryCart] = useState<CartItem[]>([]);
  
  // Track previous table statuses for notification sound
  const [prevTableStatuses, setPrevTableStatuses] = useState<Record<string, string>>({});

  // Sync activeTab with settings when they change
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);
  
  // Listen for PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstallPWA(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstallPWA = async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;
      if (outcome === 'accepted') {
        toast.success('App adicionado à tela inicial!');
      }
      deferredPromptRef.current = null;
      setCanInstallPWA(false);
    } else {
      // Fallback instructions for iOS and unsupported browsers
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast.info('Para adicionar à tela inicial no iOS: toque no botão Compartilhar e selecione "Adicionar à Tela de Início"');
      } else {
        toast.info('Para adicionar à tela inicial: abra o menu do navegador e selecione "Instalar aplicativo" ou "Adicionar à tela inicial"');
      }
    }
  };
  
  const handleSendSuggestion = () => {
    if (suggestionRating === null) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }
    toast.success('Sugestão enviada com sucesso! Obrigado pelo feedback.');
    setIsSuggestionModalOpen(false);
    setSuggestionRating(null);
    setSuggestionText('');
  };

  // Play notification sound when a table changes to 'requesting' status
  useEffect(() => {
    if (!tables || tables.length === 0) return;
    
    // Build current statuses map
    const currentStatuses: Record<string, string> = {};
    tables.forEach(table => {
      currentStatuses[table.id] = table.status;
    });
    
    // Check if any table just changed to 'requesting'
    const hasNewRequestingTable = tables.some(table => {
      const prevStatus = prevTableStatuses[table.id];
      return prevStatus && prevStatus !== 'requesting' && table.status === 'requesting';
    });
    
    // Play sound if there's a new requesting table and sound is enabled
    if (hasNewRequestingTable && notificationSoundEnabled) {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.7;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }
    
    // Update previous statuses
    setPrevTableStatuses(currentStatuses);
  }, [tables, notificationSoundEnabled]);

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

  // Filter and sort tables based on search - natural sort for "Mesa 1, Mesa 2, Mesa 10" etc
  // Also search by customer name from orders
  const filteredTables = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const filtered = tables.filter(t => {
      // Match by table name
      if (t.name.toLowerCase().includes(searchLower)) return true;
      
      // Match by customer name in active orders
      const tableOrders = orders?.filter(o => 
        o.table_id === t.id && 
        !['delivered', 'cancelled'].includes(o.status)
      ) || [];
      
      return tableOrders.some(o => 
        o.customer_name?.toLowerCase().includes(searchLower)
      );
    });
    
    // Natural sort function to handle "Mesa 1", "Mesa 2", "Mesa 10" correctly
    return filtered.sort((a, b) => {
      const aMatch = a.name.match(/(\D*)(\d+)/);
      const bMatch = b.name.match(/(\D*)(\d+)/);
      
      if (aMatch && bMatch) {
        const aPrefix = aMatch[1].toLowerCase();
        const bPrefix = bMatch[1].toLowerCase();
        
        if (aPrefix === bPrefix) {
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        return aPrefix.localeCompare(bPrefix);
      }
      
      return a.name.localeCompare(b.name);
    });
  }, [tables, searchQuery, orders]);

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

  const handleCreateTables = async (count: number) => {
    if (isCreatingTable) return;
    setIsCreatingTable(true);
    try {
      const startNumber = tables.length + 1;
      for (let i = 0; i < count; i++) {
        await createTable.mutateAsync({
          name: `Mesa ${startNumber + i}`,
          capacity: 4,
        });
      }
      setIsCreateTablesModalOpen(false);
      toast.success(`${count} mesa(s) criada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao criar mesas');
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

  const handleConfirmOrder = async (customers?: { name: string; phone: string }[]) => {
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

      // Use customer data if provided, otherwise fallback to table name
      const primaryCustomer = customers && customers.length > 0 ? customers[0] : null;
      const customerName = primaryCustomer?.name || selectedTable.name;
      const customerPhone = primaryCustomer?.phone || '00000000000';

      await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          table_id: selectedTable.id,
          waiter_id: selectedWaiter.id,
          customer_name: customerName,
          customer_phone: customerPhone,
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
    
    // Release the table and clear customer info
    if (selectedTable) {
      try {
        await updateTableStatus.mutateAsync({
          tableId: selectedTable.id,
          status: 'free',
          waiterId: null,
          orderId: null,
          clearCustomer: true,
        });
        handleBackToMap();
      } catch (error) {
        console.error('Error releasing table:', error);
      }
    }
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

  // Delivery handlers
  const handleStartDelivery = () => {
    setIsDeliveryModalOpen(false);
    setDeliveryCustomer(null);
    setDeliveryAddress(null);
    setDeliveryCart([]);
    setViewMode('deliveryCustomer');
  };

  const handleDeliveryCustomerAdvance = (phone: string, name: string) => {
    setDeliveryCustomer({ phone, name });
    setViewMode('deliveryOptions');
  };

  const handleDeliveryAddressSave = (address: DeliveryAddress) => {
    setDeliveryAddress(address);
    setViewMode('deliveryOptions');
  };

  const handleDeliveryConfirmOrder = async (method: string, changeAmount?: number) => {
    if (!restaurant || !deliveryCustomer) return;

    setIsProcessing(true);
    try {
      const subtotal = deliveryCart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
      const deliveryFee = deliveryAddress ? 5 : 0;
      
      const orderItems = deliveryCart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
        extras: []
      }));

      const addressString = deliveryAddress 
        ? `${deliveryAddress.street}, ${deliveryAddress.number} - ${deliveryAddress.neighborhood}, ${deliveryAddress.city}`
        : 'Retirar no local';

      await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurant.id,
          customer_name: deliveryCustomer.name,
          customer_phone: deliveryCustomer.phone.replace(/\D/g, ''),
          customer_address: addressString,
          items: orderItems as any,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: subtotal + deliveryFee,
          status: 'pending',
          payment_method: method,
          payment_change: changeAmount || null,
        });

      toast.success('Pedido delivery criado com sucesso!');
      setDeliveryCustomer(null);
      setDeliveryAddress(null);
      setDeliveryCart([]);
      setViewMode('map');
      refetchOrders();
    } catch (error) {
      toast.error('Erro ao criar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectDeliveryProduct = (product: any) => {
    const existing = deliveryCart.find(item => item.productId === product.id);
    if (existing) {
      setDeliveryCart(deliveryCart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setDeliveryCart([...deliveryCart, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
        image_url: product.image_url,
      }]);
    }
    setViewMode('deliveryCart');
  };

  const handleUpdateDeliveryCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setDeliveryCart(deliveryCart.filter(item => item.productId !== productId));
    } else {
      setDeliveryCart(deliveryCart.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      ));
    }
  };

  const handleRemoveFromDeliveryCart = (productId: string) => {
    setDeliveryCart(deliveryCart.filter(item => item.productId !== productId));
  };

  if (restaurantLoading || waitersLoading) {
    return (
      <div className="min-h-screen bg-[#0d2847] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  // Waiter selection screen
  if (!selectedWaiter) {
    return (
      <div className="min-h-screen bg-[#0d2847] flex items-center justify-center p-6">
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
                    className="w-full flex items-center gap-4 p-4 bg-[#1e3a5f] border border-[#1e4976] rounded-xl hover:border-cyan-500 hover:bg-[#0d2040] transition-all"
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

  // View: Settings
  if (viewMode === 'settings') {
    return (
      <WaiterSettingsView
        onBack={() => setViewMode('map')}
        restaurantName={restaurant?.name}
      />
    );
  }

  // View: Waiter List
  if (viewMode === 'waiterList') {
    return (
      <WaiterListView
        onBack={() => setViewMode('map')}
        waiters={waiters || []}
        restaurantSlug={slug}
        onCreateWaiter={async (name, phone) => {
          await createWaiter.mutateAsync({ name, phone });
        }}
        onToggleWaiterStatus={async (waiterId, active) => {
          await toggleWaiterStatus.mutateAsync({ id: waiterId, active });
        }}
        onUpdateWaiter={async (waiterId, name, phone) => {
          await updateWaiter.mutateAsync({ id: waiterId, name, phone });
        }}
        onDeleteWaiter={async (waiterId) => {
          await deleteWaiter.mutateAsync(waiterId);
        }}
      />
    );
  }

  // View: Challenges
  if (viewMode === 'challenges') {
    return (
      <WaiterChallengesView
        onBack={() => setViewMode('map')}
        waiterName={selectedWaiter?.name || 'Garçom'}
      />
    );
  }

  // View: Delivery Customer Identification
  if (viewMode === 'deliveryCustomer') {
    return (
      <DeliveryCustomerView
        onBack={() => setViewMode('map')}
        onAdvance={handleDeliveryCustomerAdvance}
      />
    );
  }

  // View: Delivery Options
  if (viewMode === 'deliveryOptions' && deliveryCustomer) {
    const subtotal = deliveryCart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    return (
      <DeliveryOptionsView
        customerName={deliveryCustomer.name}
        customerPhone={deliveryCustomer.phone}
        subtotal={subtotal > 0 ? subtotal : 10} // Default for demo
        deliveryFee={5}
        onBack={() => setViewMode('deliveryCustomer')}
        onEditCustomer={() => setViewMode('deliveryCustomer')}
        onNewAddress={() => setViewMode('deliveryAddress')}
        onConfirmOrder={handleDeliveryConfirmOrder}
        savedAddress={deliveryAddress}
      />
    );
  }

  // View: Delivery Address
  if (viewMode === 'deliveryAddress') {
    return (
      <DeliveryAddressView
        onBack={() => setViewMode('deliveryOptions')}
        onSave={handleDeliveryAddressSave}
        onShowZones={() => toast.info('Zonas de entrega')}
      />
    );
  }

  // View: Delivery Products
  if (viewMode === 'deliveryProducts') {
    return (
      <WaiterProductsView
        tableName="Delivery"
        products={products}
        categories={categories}
        onBack={() => deliveryCart.length > 0 ? setViewMode('deliveryCart') : setViewMode('deliveryOptions')}
        onSelectProduct={handleSelectDeliveryProduct}
      />
    );
  }

  // View: Delivery Cart
  if (viewMode === 'deliveryCart') {
    return (
      <WaiterCartView
        tableName="Delivery"
        items={deliveryCart}
        onBack={() => setViewMode('deliveryProducts')}
        onClearCart={() => setDeliveryCart([])}
        onAddItems={() => setViewMode('deliveryProducts')}
        onUpdateQuantity={handleUpdateDeliveryCartQuantity}
        onRemoveItem={handleRemoveFromDeliveryCart}
        onConfirmOrder={() => setViewMode('deliveryOptions')}
        isProcessing={isProcessing}
      />
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
        cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setViewMode('cart')}
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
        restaurantId={restaurant?.id || ''}
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

  // View: Comanda Orders
  if (viewMode === 'comandaOrders' && selectedComanda) {
    const comandaOrders = orders?.filter(o => o.comanda_id === selectedComanda.id) || [];
    return (
      <WaiterOrdersView
        tableName={`Comanda #${selectedComanda.number}`}
        orders={comandaOrders}
        onBack={() => setViewMode('map')}
        onPrint={() => toast.info('Imprimindo...')}
        onNewOrder={() => {
          setComandaCart([]);
          setViewMode('comandaProducts');
        }}
        onCloseBill={() => setViewMode('comandaCloseBill')}
        onMarkDelivered={handleMarkDelivered}
      />
    );
  }

  // View: Comanda Products Selection
  if (viewMode === 'comandaProducts' && selectedComanda) {
    return (
      <WaiterProductsView
        tableName={`Comanda #${selectedComanda.number}`}
        products={products}
        categories={categories}
        onBack={() => comandaCart.length > 0 ? setViewMode('comandaCart') : setViewMode('map')}
        onSelectProduct={(product: any) => {
          const existing = comandaCart.find(item => item.productId === product.id);
          if (existing) {
            setComandaCart(comandaCart.map(item =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ));
          } else {
            setComandaCart([...comandaCart, {
              productId: product.id,
              productName: product.name,
              productPrice: product.price,
              quantity: 1,
              image_url: product.image_url,
            }]);
          }
          setViewMode('comandaCart');
        }}
        cartItemsCount={comandaCart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setViewMode('comandaCart')}
      />
    );
  }

  // View: Comanda Cart
  if (viewMode === 'comandaCart' && selectedComanda) {
    const handleConfirmComandaOrder = async (customers?: { name: string; phone: string }[]) => {
      if (!restaurant || !selectedWaiter || comandaCart.length === 0) return;

      setIsProcessing(true);
      try {
        const subtotal = comandaCart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
        
        const orderItems = comandaCart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          extras: []
        }));

        // Use customer data if provided from cart, otherwise use comanda customer data
        const primaryCustomer = customers && customers.length > 0 ? customers[0] : null;
        const customerName = primaryCustomer?.name || selectedComanda.customer_name || `Comanda #${selectedComanda.number}`;
        const customerPhone = primaryCustomer?.phone || selectedComanda.customer_phone || '00000000000';

        await supabase
          .from('orders')
          .insert({
            restaurant_id: restaurant.id,
            comanda_id: selectedComanda.id,
            waiter_id: selectedWaiter.id,
            customer_name: customerName,
            customer_phone: customerPhone,
            items: orderItems as any,
            subtotal: subtotal,
            total: subtotal,
            status: 'pending',
            payment_method: 'pending'
          });

        toast.success('Pedido criado com sucesso!');
        setComandaCart([]);
        setViewMode('map');
        refetchOrders();
      } catch (error) {
        toast.error('Erro ao criar pedido');
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <WaiterCartView
        tableName={`Comanda #${selectedComanda.number}`}
        items={comandaCart}
        onBack={() => setViewMode('comandaProducts')}
        onClearCart={() => setComandaCart([])}
        onAddItems={() => setViewMode('comandaProducts')}
        onUpdateQuantity={(productId, quantity) => {
          if (quantity <= 0) {
            setComandaCart(comandaCart.filter(item => item.productId !== productId));
          } else {
            setComandaCart(comandaCart.map(item =>
              item.productId === productId ? { ...item, quantity } : item
            ));
          }
        }}
        onRemoveItem={(productId) => setComandaCart(comandaCart.filter(item => item.productId !== productId))}
        onConfirmOrder={handleConfirmComandaOrder}
        isProcessing={isProcessing}
        restaurantId={restaurant?.id || ''}
      />
    );
  }

  // View: Comanda Close Bill
  if (viewMode === 'comandaCloseBill' && selectedComanda) {
    const comandaOrders = orders?.filter(o => o.comanda_id === selectedComanda.id) || [];
    
    const handleComandaPayment = async (method: string, tipAmount: number) => {
      try {
        // Update orders to delivered first
        for (const order of comandaOrders) {
          await supabase
            .from('orders')
            .update({ status: 'delivered', delivered_at: new Date().toISOString() })
            .eq('id', order.id);
        }
        
        // Close comanda (this also clears customer_name and customer_phone)
        await closeComanda.mutateAsync({
          id: selectedComanda.id,
          payment_method: method,
          tip_amount: tipAmount,
        });
        
        toast.success(`Pagamento via ${method} registrado!`);
        setViewMode('map');
        setSelectedComanda(null);
        refetchOrders();
      } catch (error) {
        toast.error('Erro ao fechar comanda');
      }
    };

    return (
      <WaiterCloseBillView
        tableName={`Comanda #${selectedComanda.number}`}
        orders={comandaOrders}
        onBack={() => setViewMode('map')}
        onGoToMap={() => {
          setViewMode('map');
          setSelectedComanda(null);
        }}
        onPrint={() => toast.info('Imprimindo...')}
        onConfirmPayment={handleComandaPayment}
      />
    );
  }

  // View: Comanda Customer Edit
  if (viewMode === 'comandaCustomer' && selectedComanda) {
    const handleSaveComandaCustomer = async (phone: string, name: string, identifier: string) => {
      setIsSavingComandaCustomer(true);
      try {
        await updateComanda.mutateAsync({
          id: selectedComanda.id,
          customer_phone: phone.replace(/\D/g, ''),
          customer_name: name || identifier || null,
        });
        toast.success('Cliente cadastrado com sucesso!');
        refetchComandas();
        // Navigate to products view instead of going back to map
        setComandaCart([]);
        setViewMode('comandaProducts');
      } catch (error) {
        toast.error('Erro ao salvar cliente');
      } finally {
        setIsSavingComandaCustomer(false);
      }
    };

    const selectedComandaHasOrders = !!orders?.some(o => o.comanda_id === selectedComanda.id);

    return (
      <ComandaCustomerView
        comanda={selectedComanda}
        restaurantId={restaurant.id}
        hasOrders={selectedComandaHasOrders}
        onBack={() => {
          setViewMode('map');
          setSelectedComanda(null);
        }}
        onSave={handleSaveComandaCustomer}
        isSaving={isSavingComandaCustomer}
      />
    );
  }

  // Main Table Map View
  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
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
            placeholder={activeTab === 'mesas' ? 'Buscar por mesa ou cliente' : 'Buscar por nº ou cliente'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-[#1e3a5f] border-[#1e4976] text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Status Legend */}
      <div className="px-4 py-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#1e3a5f] border border-[#1e4976]"></span>
          <span className="text-slate-400">Livres</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#f26b5b]"></span>
          <span className="text-slate-400">Ocupadas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="text-slate-400">Em pagamento</span>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'mesas' ? (
        <>
          {/* Tables Grid */}
          <div className="flex-1 px-4 pb-24 overflow-y-auto">
            {filteredTables.length === 0 && searchQuery ? (
              /* Empty state when search returns no results */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-[#1e4976] flex items-center justify-center mb-6">
                  <Search className="w-10 h-10 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">
                  Não encontramos a mesa que procura
                </h3>
                <p className="text-slate-400 text-sm max-w-xs">
                  Confira se digitou o nome da mesa correta e tente novamente
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filteredTables.map(table => {
                  const hasPendingOrder = hasTablePendingOrder(table.id);
                  
                  return (
                    <TableCard
                      key={table.id}
                      table={table}
                      hasPendingOrder={hasPendingOrder}
                      cartItemsCount={selectedTable?.id === table.id ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0}
                      onClick={() => handleTableClick(table)}
                    />
                  );
                })}
                
                {/* Create Table Button */}
                <button
                  onClick={() => setIsCreateTablesModalOpen(true)}
                  className="h-[72px] rounded-md p-3 border-2 border-dashed border-[#1e4976] flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs mt-1">Criar mesas</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Comandas Tab */
        <>
          {/* Comandas Grid - 3 columns like tables */}
          <div className="flex-1 px-4 pb-24 overflow-y-auto">
            {(() => {
              const filteredComandas = comandas
                .filter(c => c.status === 'open')
                .filter(c => {
                  // When searching, only show occupied comandas (those with orders)
                  if (searchQuery) {
                    const hasOrders = orders?.some(o => o.comanda_id === c.id) || false;
                    if (!hasOrders) return false;
                  }
                  
                  return c.number.includes(searchQuery) || 
                    c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
                });
              
              if (filteredComandas.length === 0 && searchQuery) {
                return (
                  /* Empty state when search returns no results */
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#1e4976] flex items-center justify-center mb-6">
                      <Search className="w-10 h-10 text-cyan-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">
                      Não encontramos a comanda que procura
                    </h3>
                    <p className="text-slate-400 text-sm max-w-xs">
                      Confira se digitou o nome da comanda correta e tente novamente
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="grid grid-cols-3 gap-3">
                  {filteredComandas.map(comanda => {
                    const comandaOrders = orders?.filter(o => o.comanda_id === comanda.id) || [];
                    const hasOrders = comandaOrders.length > 0;
                    
                    // Comanda is only "occupied" when it has orders (not just customer info)
                    const isOccupied = hasOrders;
                    
                    return (
                      <ComandaCard
                        key={comanda.id}
                        comanda={comanda}
                        hasOrders={hasOrders}
                        cartItemsCount={selectedComanda?.id === comanda.id ? comandaCart.reduce((sum, item) => sum + item.quantity, 0) : 0}
                        onClick={() => {
                          setSelectedComanda(comanda);
                          if (isOccupied) {
                            // Show actions modal if occupied
                            setIsComandaModalOpen(true);
                          } else {
                            // Show customer form if free
                            setViewMode('comandaCustomer');
                          }
                        }}
                      />
                    );
                  })}
                  
                  {/* Create Comanda Button - opens modal */}
                  <button 
                    onClick={() => setIsCreateComandasModalOpen(true)}
                    className="h-[72px] rounded-md p-3 border-2 border-dashed border-[#1e4976] flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-xs mt-1">Criar comandas</span>
                  </button>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0d2847]">
        <button 
          onClick={() => setIsDeliveryModalOpen(true)}
          className="w-full py-4 bg-[#0d2847] border-2 border-[#1e4976] rounded-xl text-cyan-400 font-medium flex items-center justify-center gap-2 hover:border-cyan-500 transition-colors"
        >
          <Rocket className="w-5 h-5" />
          Delivery/Para Levar
        </button>
      </div>

      {/* Sidebar */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent side="left" className="w-64 bg-[#0d2847] border-r-[#1e4976] p-0">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[#1e4976] flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Mapa de mesas e comandas</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 py-4">
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setViewMode('settings');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Configurações</span>
              </button>
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setViewMode('waiterList');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>Meus garçons</span>
              </button>
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setViewMode('challenges');
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors"
              >
                <Trophy className="w-5 h-5" />
                <span>Desafios Garçom</span>
              </button>
            </nav>

            {/* Footer - Sticky buttons */}
            <div className="mt-auto sticky bottom-0 bg-[#0d2847]">
              {/* Adicionar atalho */}
              <button 
                onClick={handleInstallPWA}
                className="w-full mx-0"
              >
                <div className="mx-3 mb-3 p-3 bg-amber-500 rounded-xl cursor-pointer hover:bg-amber-600 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0d2847] rounded-lg flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium text-sm">Adicionar</p>
                        <p className="text-white font-medium text-sm">atalho</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-amber-100 text-xs mt-1">Salve na sua tela inicial</p>
                </div>
              </button>

              {/* Enviar sugestão */}
              <button 
                onClick={() => {
                  setIsSidebarOpen(false);
                  setIsSuggestionModalOpen(true);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors border-t border-[#1e4976]"
              >
                <div className="relative">
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                </div>
                <span>Enviar sugestão</span>
              </button>
              
              {/* User Info */}
              <div className="px-4 py-3 flex items-center gap-3 border-t border-[#1e4976]">
                {restaurant?.logo ? (
                  <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-lg object-cover bg-amber-500" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                    <span className="text-sm">🍔</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400">{selectedWaiter.name},</p>
                  <p className="text-white text-sm font-medium truncate">{restaurant?.name}</p>
                </div>
              </div>

              {/* Sair Button */}
              <button 
                onClick={() => setSelectedWaiter(null)}
                className="w-full px-4 py-3 flex items-center justify-center gap-2 text-cyan-400 bg-[#1e3a5f] hover:bg-[#0d2040] transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Suggestion Modal */}
      <Sheet open={isSuggestionModalOpen} onOpenChange={setIsSuggestionModalOpen}>
        <SheetContent side="bottom" className="bg-white border-t border-slate-200 p-0 rounded-t-2xl max-h-[80vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
              <h2 className="text-slate-900 font-semibold">Enviar sugestões</h2>
              <button 
                onClick={() => setIsSuggestionModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Rating question */}
              <p className="text-slate-800 font-medium mb-4">
                Como foi sua experiência ao utilizar o Aplicativo do Garçom?
              </p>
              
              {/* Emoji rating buttons */}
              <div className="flex justify-between items-center mb-6">
                {[
                  { value: 1, emoji: '😫', label: 'Horrível' },
                  { value: 2, emoji: '🙁', label: 'Ruim' },
                  { value: 3, emoji: '🙂', label: 'Ok' },
                  { value: 4, emoji: '😊', label: 'Boa' },
                  { value: 5, emoji: '🤩', label: 'Ótima' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSuggestionRating(option.value)}
                    className="flex flex-col items-center gap-1 p-2 transition-all"
                  >
                    <span className={`text-4xl transition-all ${
                      suggestionRating === option.value 
                        ? 'scale-110 grayscale-0' 
                        : suggestionRating !== null 
                          ? 'grayscale opacity-50' 
                          : 'grayscale-0'
                    }`}>{option.emoji}</span>
                    <span className={`text-xs ${
                      suggestionRating === option.value 
                        ? 'text-cyan-500 font-medium' 
                        : 'text-slate-500'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Comment textarea */}
              <p className="text-slate-800 font-medium mb-2">
                Gostaria de deixar um comentário ou sugestão sobre o aplicativo?
              </p>
              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                placeholder="Escreva sua mensagem aqui..."
                className="w-full h-24 p-3 border border-slate-300 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Submit button - sticky at bottom */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <button
                onClick={handleSendSuggestion}
                className={`w-full py-3 text-white font-medium rounded-lg transition-colors ${
                  suggestionRating !== null || suggestionText.trim().length > 0
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'bg-slate-500 hover:bg-slate-600'
                }`}
              >
                Enviar
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Tables Modal */}
      <CreateTablesModal
        isOpen={isCreateTablesModalOpen}
        onClose={() => setIsCreateTablesModalOpen(false)}
        onCreateTables={handleCreateTables}
        isCreating={isCreatingTable}
      />

      {/* Create Comandas Modal */}
      <CreateComandasModal
        isOpen={isCreateComandasModalOpen}
        onClose={() => setIsCreateComandasModalOpen(false)}
        onCreateComandas={async (count) => {
          if (!restaurant?.id || !selectedWaiter) return;
          setIsCreatingComandas(true);
          try {
            const startNumber = parseInt(getNextNumber());
            for (let i = 0; i < count; i++) {
              await createComanda.mutateAsync({
                restaurant_id: restaurant.id,
                number: String(startNumber + i),
                waiter_id: selectedWaiter.id,
              });
            }
            setIsCreateComandasModalOpen(false);
            toast.success(`${count} comanda(s) criada(s) com sucesso!`);
          } catch (error) {
            toast.error('Erro ao criar comandas');
          } finally {
            setIsCreatingComandas(false);
          }
        }}
        isCreating={isCreatingComandas}
      />

      {/* Table Modal (Bottom Sheet Style) */}
      {isTableModalOpen && selectedTable && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[1vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTableModalOpen(false);
          }}
        >
          <div className="w-[99%] max-w-none bg-white rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
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

      {/* Delivery/Para Levar Modal */}
      {isDeliveryModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[1vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeliveryModalOpen(false);
          }}
        >
          <div className="w-[99%] max-w-none bg-white rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Pedido Rápido</h2>
              <button 
                onClick={() => setIsDeliveryModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleStartDelivery}
                className="w-full py-4 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5" />
                  <span>Delivery</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  setIsDeliveryModalOpen(false);
                  toast.info('Para Levar - Em desenvolvimento');
                }}
                className="w-full py-4 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-between hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5" />
                  <span>Para Levar</span>
                </div>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comanda Modal - Only shown for occupied comandas */}
      {isComandaModalOpen && selectedComanda && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[1vh]"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsComandaModalOpen(false);
          }}
        >
          <div className="w-[99%] max-w-none bg-white rounded-2xl p-6 animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
            {(() => {
              const comandaOrders = orders?.filter(o => o.comanda_id === selectedComanda.id) || [];
              const comandaTotal = comandaOrders.reduce((sum, o) => sum + o.total, 0);
              const hasOrders = comandaOrders.length > 0;
              
              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Comanda {selectedComanda.number}
                      {/* Only show customer name when there are orders */}
                      {hasOrders && selectedComanda.customer_name && (
                        <span className="block text-sm font-normal text-gray-500 mt-1">{selectedComanda.customer_name}</span>
                      )}
                    </h2>
                    <button 
                      onClick={() => setIsComandaModalOpen(false)} 
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {hasOrders && (
                    <div className="flex items-center gap-2 mb-6 text-gray-700">
                      <DollarSign className="w-5 h-5" />
                      <span>Conta: <strong>{formatCurrency(comandaTotal)}</strong> (c/ taxa)</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    {hasOrders && (
                      <button 
                        onClick={() => {
                          setIsComandaModalOpen(false);
                          setViewMode('comandaOrders');
                        }}
                        className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                      >
                        <QrCode className="w-5 h-5" />
                        Ver pedidos
                      </button>
                    )}
                    <button 
                      className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                    >
                      <Printer className="w-5 h-5" />
                      Imprimir conferência
                    </button>
                    {hasOrders && (
                      <button 
                        onClick={() => {
                          setIsComandaModalOpen(false);
                          setViewMode('comandaCloseBill');
                        }}
                        className="w-full py-3 px-4 border-2 border-[#0066CC] rounded-xl text-[#0066CC] font-medium flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                      >
                        <DollarSign className="w-5 h-5" />
                        Fechar conta
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setIsComandaModalOpen(false);
                        setComandaCart([]);
                        setViewMode('comandaProducts');
                      }}
                      className="w-full py-3 px-4 bg-[#0066CC] rounded-xl text-white font-medium flex items-center justify-center gap-2 hover:bg-[#0055AA] transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Novo pedido
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper component with provider
const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug || '');
  
  return (
    <WaiterSettingsProvider restaurantId={restaurant?.id}>
      <WaiterAccessPageContent />
    </WaiterSettingsProvider>
  );
};

export default WaiterAccessPage;

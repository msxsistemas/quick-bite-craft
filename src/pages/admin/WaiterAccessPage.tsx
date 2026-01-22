import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, Loader2, Menu, X, Settings, Users, Trophy, 
  LogOut, Plus, Search, Rocket, QrCode,
  Printer, DollarSign, ShoppingCart, Truck, Package,
  ChevronRight, Smartphone, MessageSquare
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters } from '@/hooks/useWaiters';
import { useWaiterStats } from '@/hooks/useWaiterStats';
import { useTables, Table } from '@/hooks/useTables';
import { useOrders, Order, OrderItem, useUpdateOrderItems } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
import { WaiterToastProvider, useWaiterToast } from '@/components/waiter/WaiterToast';
import { TableCard } from '@/components/waiter/TableCard';
import { ComandaCard } from '@/components/waiter/ComandaCard';
import { CreateComandasModal } from '@/components/waiter/CreateComandasModal';
import { usePersistedCart } from '@/hooks/usePersistedCart';
import { ComandaCustomerView } from '@/components/waiter/ComandaCustomerView';
import { WaiterEditItemView } from '@/components/waiter/WaiterEditItemView';
import { markOrderAsLocallyCreated } from '@/hooks/useGlobalKitchenNotification';

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
  notes?: string;
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

type ViewMode = 'map' | 'orders' | 'products' | 'cart' | 'editCartItem' | 'editOrderItem' | 'closeBill' | 'deliveryCustomer' | 'deliveryOptions' | 'deliveryAddress' | 'deliveryProducts' | 'deliveryCart' | 'editDeliveryCartItem' | 'settings' | 'waiterList' | 'challenges' | 'comandaOrders' | 'comandaProducts' | 'comandaCart' | 'editComandaCartItem' | 'editComandaOrderItem' | 'comandaCloseBill' | 'comandaCustomer';

interface EditingCartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
  notes?: string;
  image_url?: string | null;
}

interface EditingOrderItem {
  orderId: string;
  itemIndex: number;
  item: OrderItem;
}

const WaiterAccessPageContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug || '');
  const { waiters, isLoading: waitersLoading, createWaiter, updateWaiter, deleteWaiter, toggleWaiterStatus } = useWaiters(restaurant?.id);
  const { tables, refetch: refetchTables, createTable, updateTableStatus } = useTables(restaurant?.id);
  const { data: orders, refetch: refetchOrders } = useOrders(restaurant?.id);
  const updateOrderItems = useUpdateOrderItems();
  const { products } = useProducts(restaurant?.id);
  const { categories } = useCategories(restaurant?.id);
  const { comandas, createComanda, updateComanda, closeComanda, getNextNumber, isLoading: comandasLoading, refetch: refetchComandas } = useComandas(restaurant?.id);
  const { defaultTab, notificationSoundEnabled } = useWaiterSettingsContext();
  const { saveCart, loadCart, clearCart: clearPersistedCart, getCartItemsCount, getAllCartsWithItems } = usePersistedCart(restaurant?.id);
  
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(null);
  
  // Fetch waiter stats for challenges
  const { data: waiterStats, isLoading: waiterStatsLoading } = useWaiterStats(selectedWaiter?.id, restaurant?.id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'mesas' | 'comandas'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyPendingTables, setShowOnlyPendingTables] = useState(false);
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
  
  // Get all saved carts for displaying badges on table/comanda cards
  // Re-compute when cart or comandaCart changes to reflect latest saved state
  const savedCartsMap = useMemo(() => getAllCartsWithItems(), [getAllCartsWithItems, cart, comandaCart]);
  
  // Suggestion modal states
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [suggestionRating, setSuggestionRating] = useState<number | null>(null);
  const [suggestionText, setSuggestionText] = useState('');
  
  // PWA install prompt
  const deferredPromptRef = useRef<any>(null);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [isPWAModalOpen, setIsPWAModalOpen] = useState(false);
  
  // Delivery states
  const [deliveryCustomer, setDeliveryCustomer] = useState<DeliveryCustomer | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [deliveryCart, setDeliveryCart] = useState<CartItem[]>([]);
  
  // Editing cart item state
  const [editingCartItem, setEditingCartItem] = useState<EditingCartItem | null>(null);
  
  // Editing order item state (for editing items in existing orders)
  const [editingOrderItem, setEditingOrderItem] = useState<EditingOrderItem | null>(null);
  // Track previous table statuses for notification sound
  const [prevTableStatuses, setPrevTableStatuses] = useState<Record<string, string>>({});
  
  // Toast system (global for waiter area)
  const { showToast } = useWaiterToast();

  const toast = useMemo(
    () => ({
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
      info: (message: string) => showToast(message, 'info'),
    }),
    [showToast]
  );

  // Track which table/comanda cart is currently loaded to avoid overwriting
  const [currentCartTableId, setCurrentCartTableId] = useState<string | null>(null);
  const [currentCartComandaId, setCurrentCartComandaId] = useState<string | null>(null);

  // Save cart when it changes (only if we have an active table/comanda context)
  useEffect(() => {
    if (currentCartTableId && viewMode !== 'map') {
      saveCart(cart, { tableId: currentCartTableId });
    }
  }, [cart, currentCartTableId, viewMode, saveCart]);

  // Save comanda cart when it changes
  useEffect(() => {
    if (currentCartComandaId && viewMode !== 'map') {
      saveCart(comandaCart, { comandaId: currentCartComandaId });
    }
  }, [comandaCart, currentCartComandaId, viewMode, saveCart]);

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
      // Show modal with visual instructions
      setIsPWAModalOpen(true);
    }
  };
  
  const handleSendSuggestion = async () => {
    if (suggestionRating === null) {
      toast.error('Por favor, selecione uma avaliação');
      return;
    }
    
    try {
      const { error } = await supabase.from('suggestions').insert({
        restaurant_id: restaurant?.id,
        rating: suggestionRating,
        message: suggestionText.trim() || null,
        source: 'waiter_app',
        table_id: selectedTable?.id || null,
        comanda_id: selectedComanda?.id || null,
        waiter_id: selectedWaiter?.id || null,
        customer_name: selectedTable?.customer_name || selectedComanda?.customer_name || null,
        customer_phone: selectedTable?.customer_phone || selectedComanda?.customer_phone || null,
      });
      
      if (error) throw error;
      
      toast.success('Sugestão enviada com sucesso! Obrigado pelo feedback.');
      setIsSuggestionModalOpen(false);
      setSuggestionRating(null);
      setSuggestionText('');
    } catch (error) {
      console.error('Error saving suggestion:', error);
      toast.error('Erro ao enviar sugestão. Tente novamente.');
    }
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

  // Helper to check if an order is truly pending (not delivered)
  const isOrderPending = (order: Order) => {
    return order.status === 'pending' && !order.delivered_at;
  };

  // Calculate pending orders count - MUST be at the top level (not inside conditionals)
  const pendingOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(isOrderPending).length;
  }, [orders]);

  // Calculate pending orders count per tab
  const pendingTableOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(order => isOrderPending(order) && order.table_id).length;
  }, [orders]);

  const pendingComandaOrdersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.filter(order => isOrderPending(order) && order.comanda_id).length;
  }, [orders]);

  // Get orders for selected table
  const getTableOrders = (tableId: string): Order[] => {
    return orders?.filter(o => 
      o.table_id === tableId && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    ) || [];
  };

  const tableOrders = selectedTable ? getTableOrders(selectedTable.id) : [];

  // Check if table has pending orders (for badge count)
  const hasTablePendingOrder = (tableId: string): boolean => {
    return orders?.some(o => 
      o.table_id === tableId && 
      isOrderPending(o)
    ) || false;
  };

  // Check if table is occupied (has any active orders - for color)
  const isTableOccupied = (tableId: string): boolean => {
    return orders?.some(o => 
      o.table_id === tableId && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
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
      // If filter is active, only show tables with pending orders
      if (showOnlyPendingTables) {
        const hasPending = orders?.some(o => 
          o.table_id === t.id && isOrderPending(o)
        );
        if (!hasPending) return false;
      }
      
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
  }, [tables, searchQuery, orders, showOnlyPendingTables]);

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

  const handleTableClick = async (table: Table) => {
    // Save current table cart before switching (use the tracked ID, not selectedTable which hasn't updated yet)
    if (currentCartTableId && currentCartTableId !== table.id && cart.length > 0) {
      saveCart(cart, { tableId: currentCartTableId });
    }
    
    // Clear comanda context when switching to table
    setCurrentCartComandaId(null);
    setSelectedComanda(null);
    
    // Load cart for the new table BEFORE setting state
    const savedCart = loadCart({ tableId: table.id });
    const hasSavedCart = savedCart.length > 0;
    
    // Set new table and cart context
    setSelectedTable(table);
    setCurrentCartTableId(table.id);
    setCart(savedCart);
    
    // Check if the table has pending orders
    const tableHasOrders = orders?.some(o => 
      o.table_id === table.id && 
      ['pending', 'accepted', 'preparing', 'ready'].includes(o.status)
    );
    
    // If table has saved cart items, go directly to cart view
    if (hasSavedCart && !tableHasOrders && selectedWaiter && restaurant) {
      try {
        // Open the table
        await supabase
          .from('tables')
          .update({ 
            status: 'occupied',
            current_waiter_id: selectedWaiter.id 
          })
          .eq('id', table.id);

        setViewMode('cart');
      } catch (error) {
        toast.error('Erro ao abrir mesa');
      }
    } else if (!tableHasOrders && selectedWaiter && restaurant) {
      // Table is free with no saved cart, go to products view
      try {
        // Open the table
        await supabase
          .from('tables')
          .update({ 
            status: 'occupied',
            current_waiter_id: selectedWaiter.id 
          })
          .eq('id', table.id);

        setViewMode('products');
      } catch (error) {
        toast.error('Erro ao abrir mesa');
      }
    } else {
      // Table has orders, show modal with options
      setIsTableModalOpen(true);
    }
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

      const { data: insertedOrder } = await supabase
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
        })
        .select('id')
        .single();

      // Mark as locally created to prevent duplicate notification
      if (insertedOrder?.id) {
        markOrderAsLocallyCreated(insertedOrder.id);
      }

      toast.success('Pedido criado com sucesso!');
      setCart([]);
      if (selectedTable?.id) {
        clearPersistedCart({ tableId: selectedTable.id });
      }
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
          delivered_at: delivered ? new Date().toISOString() : null
        })
        .eq('id', orderId);
      refetchOrders();
    } catch (error) {
      toast.error('Erro ao atualizar pedido');
    }
  };

  // Handler for editing an item in an existing order
  const handleEditOrderItem = async (orderId: string, itemIndex: number, item: OrderItem, newQuantity: number, newNotes: string) => {
    const order = orders?.find(o => o.id === orderId);
    if (!order) return;

    try {
      const updatedItems = [...(order.items as OrderItem[])];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        quantity: newQuantity,
        notes: newNotes,
      };

      // Recalculate subtotal and total
      const newSubtotal = updatedItems.reduce((sum, i) => {
        const extrasTotal = i.extras?.reduce((eSum, e) => eSum + e.price, 0) || 0;
        return sum + ((i.productPrice + extrasTotal) * i.quantity);
      }, 0);

      await updateOrderItems.mutateAsync({
        orderId,
        items: updatedItems,
        subtotal: newSubtotal,
        total: newSubtotal + order.tip_amount,
      });

      toast.success('Item atualizado!');
      refetchOrders();
    } catch (error) {
      toast.error('Erro ao atualizar item');
    }
  };

  // Handler for cancelling (removing) an item from an existing order
  const handleCancelOrderItem = async (orderId: string, itemIndex: number, item: OrderItem) => {
    const order = orders?.find(o => o.id === orderId);
    if (!order) return;

    try {
      const updatedItems = [...(order.items as OrderItem[])];
      updatedItems.splice(itemIndex, 1);

      // If no items left, we could optionally cancel the entire order
      if (updatedItems.length === 0) {
        // Cancel the entire order
        await supabase
          .from('orders')
          .update({ 
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
          })
          .eq('id', orderId);
        toast.success('Pedido cancelado!');
      } else {
        // Recalculate subtotal and total
        const newSubtotal = updatedItems.reduce((sum, i) => {
          const extrasTotal = i.extras?.reduce((eSum, e) => eSum + e.price, 0) || 0;
          return sum + ((i.productPrice + extrasTotal) * i.quantity);
        }, 0);

        await updateOrderItems.mutateAsync({
          orderId,
          items: updatedItems,
          subtotal: newSubtotal,
          total: newSubtotal + order.tip_amount,
        });

        toast.success('Item removido!');
      }

      refetchOrders();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  // Handler for navigating to edit order item (opens WaiterEditItemView)
  const handleNavigateToEditOrderItem = (orderId: string, itemIndex: number, item: OrderItem) => {
    setEditingOrderItem({ orderId, itemIndex, item });
    // Navigate to appropriate edit view based on context
    if (selectedTable) {
      setViewMode('editOrderItem');
    } else if (selectedComanda) {
      setViewMode('editComandaOrderItem');
    }
  };

  const handleBackToMap = () => {
    // Cart is already saved via useEffect when it changes, so just clear local state
    setViewMode('map');
    setSelectedTable(null);
    setCurrentCartTableId(null);
    setSelectedComanda(null);
    setCurrentCartComandaId(null);
    setCart([]);
    setComandaCart([]);
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

      const { data: insertedOrder } = await supabase
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
        })
        .select('id')
        .single();

      // Mark as locally created to prevent duplicate notification
      if (insertedOrder?.id) {
        markOrderAsLocallyCreated(insertedOrder.id);
      }

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

  // Restaurant not found
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#0d2847] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#1e3a5f] rounded-full flex items-center justify-center">
            <span className="text-4xl">🍔</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Restaurante não encontrado</h1>
          <p className="text-slate-400">Verifique o link e tente novamente</p>
        </div>
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
        onCreateWaiter={async (name, phone, email) => {
          await createWaiter.mutateAsync({ name, phone, email });
        }}
        onToggleWaiterStatus={async (waiterId, active) => {
          await toggleWaiterStatus.mutateAsync({ id: waiterId, active });
        }}
        onUpdateWaiter={async (waiterId, name, phone, email) => {
          await updateWaiter.mutateAsync({ id: waiterId, name, phone, email });
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
        onGoToMap={() => setViewMode('map')}
        waiterName={selectedWaiter?.name || 'Garçom'}
        totalOrders={waiterStats?.totalOrders || 0}
        isLoading={waiterStatsLoading}
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

  // View: Edit Delivery Cart Item
  if (viewMode === 'editDeliveryCartItem' && editingCartItem) {
    return (
      <WaiterEditItemView
        item={editingCartItem}
        onBack={() => {
          setEditingCartItem(null);
          setViewMode('deliveryCart');
        }}
        onSave={(updatedItem) => {
          setDeliveryCart(deliveryCart.map(item =>
            item.productId === updatedItem.productId ? updatedItem : item
          ));
          setEditingCartItem(null);
          setViewMode('deliveryCart');
        }}
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
        onEditItem={(productId) => {
          const item = deliveryCart.find(i => i.productId === productId);
          if (item) {
            setEditingCartItem(item);
            setViewMode('editDeliveryCartItem');
          }
        }}
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
        onCancelItem={handleCancelOrderItem}
        onNavigateToEditItem={handleNavigateToEditOrderItem}
      />
    );
  }

  // View: Edit Order Item (Tables)
  if (viewMode === 'editOrderItem' && editingOrderItem && selectedTable) {
    return (
      <WaiterEditItemView
        item={{
          productId: editingOrderItem.item.productId,
          productName: editingOrderItem.item.productName,
          productPrice: editingOrderItem.item.productPrice,
          quantity: editingOrderItem.item.quantity,
          notes: editingOrderItem.item.notes,
          image_url: null,
        }}
        onBack={() => {
          setEditingOrderItem(null);
          setViewMode('orders');
        }}
        onSave={async (updatedItem) => {
          await handleEditOrderItem(
            editingOrderItem.orderId,
            editingOrderItem.itemIndex,
            editingOrderItem.item,
            updatedItem.quantity,
            updatedItem.notes || ''
          );
          setEditingOrderItem(null);
          setViewMode('orders');
        }}
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
        onBack={() => setViewMode('map')}
        onSelectProduct={handleSelectProduct}
        cartItemsCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setViewMode('cart')}
      />
    );
  }

  // View: Edit Cart Item (Tables)
  if (viewMode === 'editCartItem' && editingCartItem && selectedTable) {
    return (
      <WaiterEditItemView
        item={editingCartItem}
        onBack={() => {
          setEditingCartItem(null);
          setViewMode('cart');
        }}
        onSave={(updatedItem) => {
          setCart(cart.map(item =>
            item.productId === updatedItem.productId ? updatedItem : item
          ));
          setEditingCartItem(null);
          setViewMode('cart');
        }}
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
        onEditItem={(productId) => {
          const item = cart.find(i => i.productId === productId);
          if (item) {
            setEditingCartItem(item);
            setViewMode('editCartItem');
          }
        }}
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
        restaurantId={restaurant.id}
        onBack={() => setViewMode('map')}
        onGoToMap={handleBackToMap}
        onPrint={() => toast.info('Imprimindo...')}
        onConfirmPayment={handleConfirmPayment}
        onCloseTable={async () => {
          try {
            await updateTableStatus.mutateAsync({
              tableId: selectedTable.id,
              status: 'free',
              clearCustomer: true,
            });
            toast.success('Mesa fechada com sucesso!');
            setViewMode('map');
            setSelectedTable(null);
            refetchOrders();
          } catch (error) {
            toast.error('Erro ao fechar mesa');
          }
        }}
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
        onCancelItem={handleCancelOrderItem}
        onNavigateToEditItem={handleNavigateToEditOrderItem}
      />
    );
  }

  // View: Edit Comanda Order Item
  if (viewMode === 'editComandaOrderItem' && editingOrderItem && selectedComanda) {
    return (
      <WaiterEditItemView
        item={{
          productId: editingOrderItem.item.productId,
          productName: editingOrderItem.item.productName,
          productPrice: editingOrderItem.item.productPrice,
          quantity: editingOrderItem.item.quantity,
          notes: editingOrderItem.item.notes,
          image_url: null,
        }}
        onBack={() => {
          setEditingOrderItem(null);
          setViewMode('comandaOrders');
        }}
        onSave={async (updatedItem) => {
          await handleEditOrderItem(
            editingOrderItem.orderId,
            editingOrderItem.itemIndex,
            editingOrderItem.item,
            updatedItem.quantity,
            updatedItem.notes || ''
          );
          setEditingOrderItem(null);
          setViewMode('comandaOrders');
        }}
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
        onBack={() => setViewMode('map')}
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

  // View: Edit Comanda Cart Item
  if (viewMode === 'editComandaCartItem' && selectedComanda && editingCartItem) {
    return (
      <WaiterEditItemView
        item={editingCartItem}
        onBack={() => {
          setEditingCartItem(null);
          setViewMode('comandaCart');
        }}
        onSave={(updatedItem) => {
          setComandaCart(comandaCart.map(item =>
            item.productId === updatedItem.productId ? updatedItem : item
          ));
          setEditingCartItem(null);
          setViewMode('comandaCart');
        }}
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

        const { data: insertedOrder } = await supabase
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
          })
          .select('id')
          .single();

        // Mark as locally created to prevent duplicate notification
        if (insertedOrder?.id) {
          markOrderAsLocallyCreated(insertedOrder.id);
        }

        toast.success('Pedido criado com sucesso!');
        setComandaCart([]);
        if (selectedComanda?.id) {
          clearPersistedCart({ comandaId: selectedComanda.id });
        }
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
        onEditItem={(productId) => {
          const item = comandaCart.find(i => i.productId === productId);
          if (item) {
            setEditingCartItem(item);
            setViewMode('editComandaCartItem');
          }
        }}
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
        restaurantId={restaurant.id}
        onBack={() => setViewMode('map')}
        onGoToMap={() => {
          setViewMode('map');
          setSelectedComanda(null);
        }}
        onPrint={() => toast.info('Imprimindo...')}
        onConfirmPayment={handleComandaPayment}
        onCloseTable={async () => {
          try {
            await updateComanda.mutateAsync({
              id: selectedComanda.id,
              status: 'closed',
              closed_at: new Date().toISOString(),
            });
            toast.success('Comanda fechada com sucesso!');
            setViewMode('map');
            setSelectedComanda(null);
            refetchComandas();
            refetchOrders();
          } catch (error) {
            toast.error('Erro ao fechar comanda');
          }
        }}
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
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-40 h-[52px]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="relative p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            {!isSidebarOpen && <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>}
          </button>
          <h1 className="text-white font-semibold">Mapa de mesas e comandas</h1>
        </div>
        
        {/* Pending Orders Counter / Filter Toggle */}
        {pendingOrdersCount > 0 && (
          <button
            onClick={() => setShowOnlyPendingTables(!showOnlyPendingTables)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
              showOnlyPendingTables 
                ? 'bg-amber-500 border border-amber-400' 
                : 'bg-amber-500/20 border border-amber-500/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showOnlyPendingTables ? 'bg-white' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className={`text-sm font-medium ${showOnlyPendingTables ? 'text-white' : 'text-amber-400'}`}>
              {pendingOrdersCount} {pendingOrdersCount === 1 ? 'pedido' : 'pedidos'}
            </span>
          </button>
        )}
      </header>

      {/* Toasts handled by WaiterToastProvider */}

      {/* Overlay Sidebar with backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 top-[52px] bg-black/30 z-40 animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div 
        className={`fixed top-[52px] left-0 w-52 h-[calc(100vh-52px)] bg-[#0d2847] border-r border-[#1e4976] z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
          {/* Menu Items */}
          <nav className="flex-1 py-0">
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                setViewMode('settings');
              }}
              className="w-full px-4 h-12 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors border-b border-[#1e4976]"
            >
              <Settings className="w-5 h-5" />
              <span>Configurações</span>
            </button>
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                setViewMode('waiterList');
              }}
              className="w-full px-4 h-12 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors border-b border-[#1e4976]"
            >
              <Users className="w-5 h-5" />
              <span>Meus garçons</span>
            </button>
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                setViewMode('challenges');
              }}
              className="w-full px-4 h-12 flex items-center gap-3 text-slate-300 hover:bg-[#1e4976] transition-colors border-b border-[#1e4976]"
            >
              <Trophy className="w-5 h-5" />
              <span>Desafios Garçom</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="mt-auto">
            {/* Adicionar atalho */}
            <button 
              onClick={handleInstallPWA}
              className="w-full mx-0"
            >
              <div className="mx-3 mb-3 p-3 bg-[#1e4976] rounded-xl cursor-pointer hover:bg-[#2a5a8a] transition-colors">
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
                <p className="text-slate-400 text-xs mt-1">Salve na sua tela inicial</p>
              </div>
            </button>

            {/* Enviar sugestão */}
            <button 
              onClick={() => {
                setIsSidebarOpen(false);
                setSuggestionRating(null);
                setSuggestionText('');
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
                <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1e4976] flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{selectedWaiter?.name},</p>
                <p className="text-white text-sm font-medium truncate">{restaurant?.name}</p>
              </div>
            </div>

            {/* Sair Button */}
            <button 
              onClick={() => setSelectedWaiter(null)}
              className="w-full px-4 py-2.5 flex items-center justify-center gap-2 text-cyan-400 border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs - aligned with sidebar items */}
        <div className="flex h-12">
          <button
            onClick={() => setActiveTab('mesas')}
            className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'mesas' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-[#0d2847] text-slate-400 hover:text-white'
            }`}
          >
            Mesas
            {pendingTableOrdersCount > 0 && (
              <span className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                activeTab === 'mesas' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {pendingTableOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comandas')}
            className={`flex-1 flex items-center justify-center gap-2 font-medium transition-colors ${
              activeTab === 'comandas' 
                ? 'bg-cyan-500 text-white' 
                : 'bg-[#0d2847] text-slate-400 hover:text-white'
            }`}
          >
            Comandas
            {pendingComandaOrdersCount > 0 && (
              <span className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                activeTab === 'comandas' 
                  ? 'bg-white/20 text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {pendingComandaOrdersCount}
              </span>
            )}
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
                className="pl-12 bg-white border-2 border-cyan-500 text-slate-800 placeholder:text-slate-400 h-12 rounded-xl focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-600"
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
                      const tableOccupied = isTableOccupied(table.id);
                      const tablePendingCount = orders?.filter(o => o.table_id === table.id && isOrderPending(o)).length || 0;
                      // Get saved cart count from localStorage for this table
                      const savedCartCount = savedCartsMap[`table_${table.id}`] || 0;
                      // Use current cart count if this table is selected, otherwise use saved count
                      const displayCartCount = currentCartTableId === table.id 
                        ? cart.reduce((sum, item) => sum + item.quantity, 0) 
                        : savedCartCount;
                      
                      return (
                        <TableCard
                          key={table.id}
                          table={table}
                          hasPendingOrder={hasPendingOrder}
                          isOccupied={tableOccupied}
                          pendingOrdersCount={tablePendingCount}
                          cartItemsCount={displayCartCount}
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
                      // If filter is active, only show comandas with pending orders
                      if (showOnlyPendingTables) {
                        const hasPending = orders?.some(o => 
                          o.comanda_id === c.id && o.status === 'pending'
                        );
                        if (!hasPending) return false;
                      }
                      
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
                        
                        // Get saved cart count from localStorage for this comanda
                        const savedCartCount = savedCartsMap[`comanda_${comanda.id}`] || 0;
                        // Use current cart count if this comanda is selected, otherwise use saved count
                        const displayCartCount = currentCartComandaId === comanda.id 
                          ? comandaCart.reduce((sum, item) => sum + item.quantity, 0) 
                          : savedCartCount;
                        
                        // Comanda is only "occupied" when it has orders (not just customer info)
                        const isOccupied = hasOrders;
                        
                        return (
                          <ComandaCard
                            key={comanda.id}
                            comanda={comanda}
                            hasOrders={hasOrders}
                            cartItemsCount={displayCartCount}
                            onClick={() => {
                              // Save current comanda cart before switching
                              if (currentCartComandaId && currentCartComandaId !== comanda.id && comandaCart.length > 0) {
                                saveCart(comandaCart, { comandaId: currentCartComandaId });
                              }
                              
                              // Clear table context when switching to comanda
                              setCurrentCartTableId(null);
                              setSelectedTable(null);
                              
                              // Load cart for the new comanda
                              const savedComandaCart = loadCart({ comandaId: comanda.id });
                              
                              setSelectedComanda(comanda);
                              setCurrentCartComandaId(comanda.id);
                              setComandaCart(savedComandaCart);
                              
                              // If has saved cart and no orders, go directly to cart
                              if (savedComandaCart.length > 0 && !isOccupied) {
                                setViewMode('comandaCart');
                              } else if (isOccupied) {
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
        </div>


      {/* Suggestion Modal */}
      <Sheet open={isSuggestionModalOpen} onOpenChange={setIsSuggestionModalOpen}>
        <SheetContent side="bottom" hideCloseButton className="bg-white border-t border-slate-200 p-0 rounded-t-2xl max-h-[80vh]">
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
                        : 'grayscale'
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

      {/* PWA Install Modal */}
      <Sheet open={isPWAModalOpen} onOpenChange={setIsPWAModalOpen}>
        <SheetContent side="bottom" hideCloseButton className="bg-white border-t border-slate-200 p-0 rounded-t-2xl max-h-[80vh]">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-200">
              <h2 className="text-slate-900 font-semibold">Instale o aplicativo</h2>
              <button 
                onClick={() => setIsPWAModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* App Info */}
              <div className="p-4 bg-[#f8f5f0] rounded-2xl mb-6">
                <div className="flex items-center gap-4">
                  {restaurant?.logo ? (
                    <img src={restaurant.logo} alt={restaurant.name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-[#1e4976] rounded-xl flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-cyan-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-900 font-semibold text-base truncate">
                      {restaurant?.name ? `${restaurant.name} - Garçom` : 'App do Garçom'}
                    </p>
                    <p className="text-slate-500 text-sm truncate">{window.location.hostname}</p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-5">
                {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">1. Toque no</span>
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg">
                        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </span>
                      <span className="text-slate-800 text-sm">no menu do navegador</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">2. Role e selecione</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700">
                        Adicionar à Tela de início
                        <Plus className="w-4 h-4 text-slate-500" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">3. Procure o ícone</span>
                      {restaurant?.logo ? (
                        <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-[#1e4976] rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}
                      <span className="text-slate-800 text-sm">na tela inicial</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">1. Toque no</span>
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg">
                        <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </span>
                      <span className="text-slate-800 text-sm">no menu do navegador</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">2. Role e selecione</span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-700">
                        Adicionar à Tela de início
                        <Plus className="w-4 h-4 text-slate-500" />
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-800 text-sm font-medium">3. Procure o ícone</span>
                      {restaurant?.logo ? (
                        <img src={restaurant.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-[#1e4976] rounded-lg flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-cyan-400" />
                        </div>
                      )}
                      <span className="text-slate-800 text-sm">na tela inicial</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// Wrapper component with providers
const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug || '');
  
  return (
    <WaiterToastProvider>
      <WaiterSettingsProvider restaurantId={restaurant?.id}>
        <WaiterAccessPageContent />
      </WaiterSettingsProvider>
    </WaiterToastProvider>
  );
};

export default WaiterAccessPage;

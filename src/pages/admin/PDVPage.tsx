import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Filter, Clock, Settings, Plus, Users, DollarSign, User, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWaiters } from '@/hooks/useWaiters';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useTables, Table } from '@/hooks/useTables';
import { useCreateOrder, OrderItem } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type TableStatus = 'all' | 'free' | 'occupied' | 'requesting' | 'reserved';

interface CartItem {
  productId: string;
  productName: string;
  productPrice: number;
  quantity: number;
}

const PDVPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant } = useRestaurantBySlug(slug || '');
  const { waiters } = useWaiters(restaurant?.id);
  const { tables, isLoading: tablesLoading, createTable, updateTableStatus } = useTables(restaurant?.id);
  const { products } = useProducts(restaurant?.id);
  const { categories } = useCategories(restaurant?.id);
  const createOrder = useCreateOrder();
  
  const [filter, setFilter] = useState<TableStatus>('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New table form
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState('4');

  const statusCounts = {
    all: tables.length,
    free: tables.filter(t => t.status === 'free').length,
    occupied: tables.filter(t => t.status === 'occupied').length,
    requesting: tables.filter(t => t.status === 'requesting').length,
    reserved: tables.filter(t => t.status === 'reserved').length,
  };

  const filteredTables = filter === 'all' 
    ? tables 
    : tables.filter(t => t.status === filter);

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
    console.log('Table clicked:', table.name, table.status);
    setSelectedTable(table);
    setSelectedWaiterId(table.current_waiter_id || '');
    setTipAmount('0');
    setTipPercentage(null);
    setCart([]);
    setCustomerName('');
    setPaymentMethod('dinheiro');
    
    if (table.status === 'free') {
      // Open order modal for free tables
      console.log('Opening order modal for free table');
      setIsOrderModalOpen(true);
    } else {
      // Open settings modal for occupied tables
      console.log('Opening settings modal for occupied table');
      setIsModalOpen(true);
    }
  };

  const handleTipPercentageClick = (percentage: number) => {
    const orderTotal = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
    setTipPercentage(percentage);
    const calculatedTip = (orderTotal * percentage) / 100;
    setTipAmount(calculatedTip.toFixed(2));
  };

  const addToCart = (product: { id: string; name: string; price: number }) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.productId === productId ? { ...item, quantity } : item
    ));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);
  const totalWithTip = cartTotal + (parseFloat(tipAmount) || 0);

  const handleCreateOrder = async () => {
    if (!restaurant?.id || !selectedTable || cart.length === 0) {
      toast.error('Adicione produtos ao pedido');
      return;
    }

    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente');
      return;
    }

    try {
      const orderItems: OrderItem[] = cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productPrice: item.productPrice,
        quantity: item.quantity,
      }));

      const order = await createOrder.mutateAsync({
        restaurant_id: restaurant.id,
        customer_name: customerName,
        customer_phone: 'PDV',
        subtotal: cartTotal,
        discount: 0,
        total: totalWithTip,
        delivery_fee: 0,
        payment_method: paymentMethod,
        items: orderItems,
        waiter_id: selectedWaiterId || undefined,
        tip_amount: parseFloat(tipAmount) || 0,
        table_id: selectedTable.id,
      });

      // Update table status to occupied
      await updateTableStatus.mutateAsync({
        tableId: selectedTable.id,
        status: 'occupied',
        waiterId: selectedWaiterId || null,
        orderId: order.id,
      });

      toast.success(`Pedido #${order.order_number} criado!`);
      setIsOrderModalOpen(false);
      setCart([]);
      setSelectedTable(null);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Erro ao criar pedido');
    }
  };

  const handleCloseTable = async () => {
    if (!selectedTable) return;

    try {
      await updateTableStatus.mutateAsync({
        tableId: selectedTable.id,
        status: 'free',
        waiterId: null,
        orderId: null,
      });

      toast.success('Mesa fechada com sucesso!');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Erro ao fechar mesa');
    }
  };

  const handleRequestBill = async () => {
    if (!selectedTable) return;

    try {
      await updateTableStatus.mutateAsync({
        tableId: selectedTable.id,
        status: 'requesting',
        waiterId: selectedTable.current_waiter_id,
        orderId: selectedTable.current_order_id,
      });

      toast.success('Mesa marcada como pedindo conta');
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Erro ao atualizar mesa');
    }
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim()) {
      toast.error('Informe o nome da mesa');
      return;
    }

    try {
      await createTable.mutateAsync({
        name: newTableName,
        capacity: parseInt(newTableCapacity) || 4,
      });
      setIsNewTableModalOpen(false);
      setNewTableName('');
      setNewTableCapacity('4');
    } catch (error) {
      console.error('Error creating table:', error);
    }
  };

  const activeWaiters = waiters?.filter(w => w.active) || [];
  const activeProducts = products?.filter(p => p.active && p.visible) || [];
  const filteredProducts = selectedCategory === 'all' 
    ? activeProducts 
    : activeProducts.filter(p => p.category === selectedCategory);

  if (tablesLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

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
            <Button size="sm" className="gap-2" onClick={() => setIsNewTableModalOpen(true)}>
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
        {tables.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-xl border-2 border-dashed">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma mesa cadastrada</h3>
            <p className="text-muted-foreground mb-4">Adicione mesas para começar a usar o PDV</p>
            <Button onClick={() => setIsNewTableModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Adicionar Mesa
            </Button>
          </div>
        ) : (
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
                {table.description && (
                  <p className="text-sm text-muted-foreground mb-3">{table.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Capacidade: {table.capacity}</span>
                </div>
                {table.waiter && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <User className="w-4 h-4" />
                    <span>{table.waiter.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Order Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {selectedTable?.name} - Novo Pedido
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Products */}
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  Todos
                </Button>
                {categories?.filter(c => c.active).map(cat => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.emoji} {cat.name}
                  </Button>
                ))}
              </div>
              
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-2 gap-2 pr-4">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => addToCart({ id: product.id, name: product.name, price: product.price })}
                      className="p-3 border rounded-lg text-left hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-sm text-primary font-semibold">{formatCurrency(product.price)}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Cart & Settings */}
            <div className="space-y-4 border-l pl-6">
              {/* Customer Name */}
              <div className="space-y-2">
                <Label>Nome do Cliente</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>

              {/* Waiter Selection */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Garçom
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
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="debito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cart Items */}
              <div className="space-y-2">
                <Label>Itens do Pedido</Label>
                <ScrollArea className="h-[150px] border rounded-lg p-2">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Clique nos produtos para adicionar
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.productId} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex-1 truncate">{item.productName}</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}
                            >
                              +
                            </Button>
                            <span className="w-20 text-right">{formatCurrency(item.productPrice * item.quantity)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Tip */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Gorjeta
                </Label>
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
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
                  />
                </div>
              </div>

              {/* Total */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                {parseFloat(tipAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Gorjeta:</span>
                    <span className="text-green-600">{formatCurrency(parseFloat(tipAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(totalWithTip)}</span>
                </div>
              </div>

              <Button
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || !customerName.trim() || createOrder.isPending}
                className="w-full"
                size="lg"
              >
                {createOrder.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                Criar Pedido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table Settings Modal (for occupied tables) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {selectedTable?.name} - Gerenciar
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusBadgeColor(selectedTable?.status || '')}>
                  {getStatusLabel(selectedTable?.status || '')}
                </Badge>
              </div>
              {selectedTable?.waiter && (
                <div>
                  <p className="text-sm text-muted-foreground">Garçom</p>
                  <p className="font-medium">{selectedTable.waiter.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleRequestBill}
                disabled={selectedTable?.status === 'requesting'}
              >
                Pedir Conta
              </Button>
              <Button
                variant="destructive"
                onClick={handleCloseTable}
              >
                Fechar Mesa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Table Modal */}
      <Dialog open={isNewTableModalOpen} onOpenChange={setIsNewTableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Mesa</Label>
              <Input
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Ex: Mesa 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                type="number"
                min="1"
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsNewTableModalOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleCreateTable} disabled={createTable.isPending} className="flex-1">
              {createTable.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default PDVPage;

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Clock, ChevronRight, Phone, Loader2 } from 'lucide-react';
import { useOrderByPhone, getStatusLabel, getStatusColor, Order } from '@/hooks/useOrders';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNavigation } from '@/components/menu/BottomNavigation';
import { useCart } from '@/contexts/CartContext';

const OrderHistoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = usePublicMenu(slug);
  const { setIsOpen: setIsCartOpen } = useCart();

  const [phone, setPhone] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  const { data: orders = [], isLoading: ordersLoading, isFetched } = useOrderByPhone(
    restaurant?.id,
    searchPhone
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 10) {
      setSearchPhone(phone.trim());
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Meus Pedidos</h1>
            <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Buscar pedidos</h3>
                <p className="text-sm text-muted-foreground">Digite seu telefone para ver seus pedidos</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="phone" className="text-muted-foreground">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="text-lg"
                />
              </div>
              <Button type="submit" className="w-full" disabled={phone.trim().length < 10}>
                <Search className="w-4 h-4 mr-2" />
                Buscar pedidos
              </Button>
            </div>
          </div>
        </form>

        {/* Loading */}
        {ordersLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Results */}
        {isFetched && !ordersLoading && (
          <>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground text-sm">
                  Não encontramos pedidos com esse telefone.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                </p>
                
                {orders.map((order) => {
                  const statusColors = getStatusColor(order.status);
                  
                  return (
                    <button
                      key={order.id}
                      onClick={() => navigate(`/r/${slug}/order?id=${order.id}`)}
                      className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">#{order.order_number}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors.bg} ${statusColors.text}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(order.created_at)} às {formatTime(order.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="font-bold text-primary">{formatCurrency(order.total)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!isFetched && !ordersLoading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Busque seus pedidos</h3>
            <p className="text-muted-foreground text-sm">
              Digite seu telefone acima para ver o histórico de pedidos.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="orders" 
        onCartClick={() => setIsCartOpen(true)}
      />
    </div>
  );
};

export default OrderHistoryPage;

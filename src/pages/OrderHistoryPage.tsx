import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { useOrderByPhone, Order } from '@/hooks/useOrders';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { PhoneInput, isValidPhone, getPhoneDigits } from '@/components/ui/phone-input';
import { BottomNavigation } from '@/components/menu/BottomNavigation';
import { useCart } from '@/contexts/CartContext';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { supabase } from '@/integrations/supabase/client';
const OrderHistoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = usePublicMenu(slug);
  const { setIsOpen: setIsCartOpen } = useCart();

  const storageKey = slug ? `order-history-${slug}` : null;
  
  const [phone, setPhone] = useState(() => {
    if (!storageKey) return '';
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).phone || '' : '';
  });
  const [name, setName] = useState(() => {
    if (!storageKey) return '';
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).name || '' : '';
  });
  const [searchPhone, setSearchPhone] = useState(() => {
    if (!storageKey) return '';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { phone: savedPhone } = JSON.parse(saved);
      if (savedPhone) {
        return savedPhone.replace(/\D/g, '');
      }
    }
    return '';
  });
  const [isLoadingName, setIsLoadingName] = useState(false);

  const { data: orders = [], isLoading: ordersLoading, isFetched } = useOrderByPhone(
    restaurant?.id,
    searchPhone
  );

  // Save to localStorage when search is successful
  useEffect(() => {
    if (storageKey && searchPhone && orders.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify({ phone, name }));
    }
  }, [storageKey, searchPhone, orders.length, phone, name]);

  // Auto-fetch customer name when phone is valid
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!restaurant?.id || !isValidPhone(phone)) {
        return;
      }

      const phoneDigits = getPhoneDigits(phone);
      setIsLoadingName(true);

      try {
        // Search by customer_phone_digits column
        const { data, error } = await supabase
          .from('orders')
          .select('customer_name')
          .eq('restaurant_id', restaurant.id)
          .eq('customer_phone_digits', phoneDigits)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Name lookup result:', { phone, phoneDigits, data, error });

        if (data?.customer_name) {
          setName(data.customer_name);
        }
      } catch {
        // No previous order found, that's ok
      } finally {
        setIsLoadingName(false);
      }
    };

    fetchCustomerName();
  }, [phone, restaurant?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidPhone(phone)) {
      setSearchPhone(getPhoneDigits(phone));
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `Em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; bg: string }> = {
      pending: { label: 'Pendente', bg: 'bg-green-600' },
      accepted: { label: 'Aceito', bg: 'bg-green-600' },
      preparing: { label: 'Em produção', bg: 'bg-orange-500' },
      ready: { label: 'Pronto', bg: 'bg-green-600' },
      delivering: { label: 'Saiu para entrega', bg: 'bg-green-600' },
      delivered: { label: 'Finalizado', bg: 'bg-stone-500' },
      cancelled: { label: 'Cancelado', bg: 'bg-red-600' },
    };
    
    const config = statusConfig[status] || { label: status, bg: 'bg-gray-500' };
    
    return (
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${config.bg} text-white`}>
        {config.label}
      </span>
    );
  };

  const isOrderActive = (status: string) => {
    return ['pending', 'accepted', 'preparing', 'ready', 'delivering'].includes(status);
  };


  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show results view after successful search
  const showResults = isFetched && orders.length > 0;

  return (
    <div className={`min-h-screen pb-20 ${showResults ? 'bg-muted/40' : 'bg-background'}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => {
              if (showResults) {
                // Go back to search form
                setSearchPhone('');
              } else {
                navigate(`/r/${slug}`);
              }
            }}
            className="p-1"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Meus pedidos</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Search Form - Only show when no results */}
        {!showResults && (
          <form onSubmit={handleSearch} className="space-y-6 py-2">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Seu número de WhatsApp é:
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="h-14 text-base border-border"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Seu nome e sobrenome:
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  className="h-14 text-base border-border"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValidPhone(phone)}
              className="w-full py-3 rounded-lg font-semibold text-base transition-colors disabled:bg-muted disabled:text-muted-foreground bg-[hsl(221,83%,53%)] text-white hover:bg-[hsl(221,83%,48%)]"
            >
              Avançar
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Digite seu telefone para ver o histórico de pedidos deste restaurante.
            </p>
          </form>
        )}

        {/* Loading */}
        {ordersLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* No results found */}
        {isFetched && !ordersLoading && orders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground text-sm">
              Não encontramos pedidos com esse telefone.
            </p>
          </div>
        )}

        {/* Results */}
        {showResults && (
              <div className="space-y-5">
                {orders.map((order) => {
                  const active = isOrderActive(order.status);
                  const hasWaiter = !!order.waiter_id;
                  
                  return (
                    <div
                      key={order.id}
                      className="bg-background border border-border rounded-lg p-4 shadow-sm"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-bold text-lg">Pedido #{order.order_number}</h3>
                          <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
                          {hasWaiter && (
                            <p className="text-sm text-muted-foreground">Pedido feito pelo garçom</p>
                          )}
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      {/* Items */}
                      <div className="border border-border rounded-md p-3 my-3 space-y-1">
                        {order.items.slice(0, 3).map((item: any, idx: number) => (
                          <p key={idx} className="text-sm text-foreground">
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-muted-foreground">
                            +{order.items.length - 3} {order.items.length - 3 === 1 ? 'item' : 'itens'}
                          </p>
                        )}
                      </div>

                      {/* Total */}
                      <p className="font-bold text-foreground mb-4">{formatCurrency(order.total)}</p>

                      {/* Action Buttons */}
                      {active ? (
                        <button
                          onClick={() => navigate(`/r/${slug}/order?id=${order.id}`)}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors"
                        >
                          <WhatsAppIcon className="w-5 h-5" />
                          Acompanhar pedido
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <button
                            onClick={() => navigate(`/r/${slug}/order?id=${order.id}`)}
                            className="w-full py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            Detalhes do pedido
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement repeat order functionality
                              navigate(`/r/${slug}`);
                            }}
                            className="w-full py-3 bg-[hsl(221,83%,53%)] text-white font-semibold rounded-lg hover:bg-[hsl(221,83%,48%)] transition-colors"
                          >
                            Repetir pedido
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
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

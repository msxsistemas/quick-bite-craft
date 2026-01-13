import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Plus, Minus, Trash2, Pencil, ChevronRight, Store, Banknote, CreditCard, QrCode } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().trim().min(10, 'Telefone inválido').max(20),
});

const addressSchema = z.object({
  cep: z.string().trim().min(8, 'CEP inválido').max(9),
  street: z.string().trim().min(3, 'Rua é obrigatória').max(200),
  number: z.string().trim().min(1, 'Número é obrigatório').max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().trim().min(2, 'Bairro é obrigatório').max(100),
  city: z.string().trim().min(2, 'Cidade é obrigatória').max(100),
});

type PaymentMethod = 'cash' | 'debit' | 'credit' | 'pix';
type OrderType = 'delivery' | 'pickup';

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = usePublicMenu(slug);
  const { items, getTotalPrice, updateQuantity, removeItem, clearCart } = useCart();

  const [orderType, setOrderType] = useState<OrderType>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [changeFor, setChangeFor] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === 'delivery' ? (restaurant?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  const isStoreOpen = restaurant?.is_open ?? false;

  const fetchAddressByCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setStreet(data.logradouro || '');
      setNeighborhood(data.bairro || '');
      setCity(`${data.localidade} - ${data.uf}`);
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    // Format CEP as 00000-000
    const cleanValue = value.replace(/\D/g, '');
    let formatted = cleanValue;
    if (cleanValue.length > 5) {
      formatted = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
    }
    setCep(formatted);

    if (cleanValue.length === 8) {
      fetchAddressByCep(cleanValue);
    }
  };

  const validateForm = (): boolean => {
    const fieldErrors: Record<string, string> = {};

    // Validate customer data
    try {
      customerSchema.parse({ name: customerName, phone: customerPhone });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
      }
    }

    // Validate address if delivery
    if (orderType === 'delivery') {
      try {
        addressSchema.parse({ cep, street, number, complement, neighborhood, city });
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach((err) => {
            fieldErrors[err.path[0] as string] = err.message;
          });
        }
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      toast.error('Preencha os campos corretamente');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (!isStoreOpen) {
      toast.error('A loja está fechada no momento');
      return;
    }

    setIsSubmitting(true);

    // Build WhatsApp message
    const orderItems = items.map((item, index) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const itemTotal = (item.product.price + extrasTotal) * item.quantity;
      let itemText = `${item.quantity}x ${item.product.name} - ${formatCurrency(itemTotal)}`;
      if (item.extras && item.extras.length > 0) {
        itemText += `\n   Extras: ${item.extras.map(e => e.optionName).join(', ')}`;
      }
      if (item.notes) {
        itemText += `\n   Obs: ${item.notes}`;
      }
      return itemText;
    }).join('\n');

    const orderTypeText = orderType === 'delivery' ? 'Entrega' : 'Retirada';
    const paymentMethodText = {
      cash: `Dinheiro${changeFor ? ` (Troco para ${changeFor})` : ''}`,
      debit: 'Débito',
      credit: 'Crédito',
      pix: 'Pix',
    }[paymentMethod];

    const fullAddress = orderType === 'delivery' 
      ? `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}, ${city} - CEP: ${cep}`
      : 'Retirada no local';

    const message = `🍔 *NOVO PEDIDO*

📋 *Itens:*
${orderItems}

💰 *Subtotal:* ${formatCurrency(subtotal)}
${orderType === 'delivery' ? `🚚 *Taxa de entrega:* ${formatCurrency(deliveryFee)}\n` : ''}*Total:* ${formatCurrency(total)}

📍 *Tipo:* ${orderTypeText}
${orderType === 'delivery' ? `🏠 *Endereço:* ${fullAddress}\n` : ''}💳 *Pagamento:* ${paymentMethodText}

👤 *Cliente:* ${customerName}
📞 *Telefone:* ${customerPhone}`;

    const whatsappNumber = restaurant?.whatsapp?.replace(/\D/g, '') || restaurant?.phone?.replace(/\D/g, '');
    
    if (whatsappNumber) {
      const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      clearCart();
      toast.success('Pedido enviado! Você será redirecionado para o WhatsApp.');
      navigate(`/r/${slug}`);
    } else {
      toast.error('Número de WhatsApp não configurado');
    }

    setIsSubmitting(false);
  };

  if (restaurantLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-foreground mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-4">Adicione itens antes de finalizar o pedido.</p>
        <Button onClick={() => navigate(`/r/${slug}`)}>
          Voltar ao cardápio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Finalize seu pedido</h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Store Closed Alert */}
        {!isStoreOpen && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
            <Store className="w-6 h-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Loja fechada</p>
              <p className="text-sm text-destructive/80">Não estamos aceitando pedidos no momento</p>
            </div>
          </div>
        )}

        {/* Order Type Tabs */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="delivery">Entrega</TabsTrigger>
            <TabsTrigger value="pickup">Retirada</TabsTrigger>
          </TabsList>

          <TabsContent value="delivery" className="mt-4">
            <div>
              <h3 className="font-semibold mb-4">Endereço de entrega</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cep" className="text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className={errors.cep ? 'border-destructive' : ''}
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {errors.cep && <p className="text-sm text-destructive mt-1">{errors.cep}</p>}
                </div>
                
                <div>
                  <Label htmlFor="street" className="text-muted-foreground">Rua</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                    className={errors.street ? 'border-destructive' : ''}
                  />
                  {errors.street && <p className="text-sm text-destructive mt-1">{errors.street}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number" className="text-muted-foreground">Número</Label>
                    <Input
                      id="number"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className={errors.number ? 'border-destructive' : ''}
                    />
                    {errors.number && <p className="text-sm text-destructive mt-1">{errors.number}</p>}
                  </div>
                  <div>
                    <Label htmlFor="complement" className="text-muted-foreground">Complemento</Label>
                    <Input
                      id="complement"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, bloco..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood" className="text-muted-foreground">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                    className={errors.neighborhood ? 'border-destructive' : ''}
                  />
                  {errors.neighborhood && <p className="text-sm text-destructive mt-1">{errors.neighborhood}</p>}
                </div>

                <div>
                  <Label htmlFor="city" className="text-muted-foreground">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade - UF"
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pickup" className="mt-4">
            <div>
              <h3 className="font-semibold mb-3">Local para retirada</h3>
              <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{restaurant?.address || 'Endereço não informado'}</p>
                  <p className="text-sm text-primary mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Previsão: {restaurant?.delivery_time || '30-45 min'} após confirmação
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Customer Data */}
        <div>
          <h3 className="font-semibold mb-4">Dados do cliente</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-muted-foreground">Nome completo</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Seu nome"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="text-muted-foreground">Telefone</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h3 className="font-semibold mb-2">Método de pagamento</h3>
          <p className="text-sm text-primary mb-4">Pague na entrega</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'cash' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Banknote className="w-5 h-5" />
              <span>Dinheiro</span>
            </button>
            <button
              onClick={() => setPaymentMethod('debit')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'debit' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Débito</span>
            </button>
            <button
              onClick={() => setPaymentMethod('credit')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'credit' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Crédito</span>
            </button>
            <button
              onClick={() => setPaymentMethod('pix')}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'pix' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <QrCode className="w-5 h-5" />
              <span>Pix</span>
            </button>
          </div>

          {/* Change For (only for cash) */}
          {paymentMethod === 'cash' && (
            <div className="mt-4 bg-primary/5 rounded-xl p-4">
              <Label htmlFor="change" className="text-primary">Troco para quanto?</Label>
              <Input
                id="change"
                value={changeFor}
                onChange={(e) => setChangeFor(e.target.value)}
                placeholder="R$ 50,00"
                className="mt-2 bg-background"
              />
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div>
          <h3 className="font-semibold mb-4 text-center">Resumo do pedido</h3>
          <div className="space-y-4">
            {items.map((item, index) => {
              const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
              const itemPrice = (item.product.price + extrasTotal) * item.quantity;

              return (
                <div key={`${item.product.id}-${index}`} className="flex gap-3">
                  {item.product.image ? (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-primary font-bold">{formatCurrency(itemPrice)}</p>
                        {item.extras && item.extras.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {item.extras.map(e => e.optionName).join(', ')}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">Obs: {item.notes}</p>
                        )}
                      </div>
                      <button className="text-muted-foreground hover:text-primary">
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => removeItem(index)}
                        className="text-destructive text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add More Items */}
          <button
            onClick={() => navigate(`/r/${slug}`)}
            className="w-full mt-4 flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="font-medium">Esqueceu algum produto?</p>
                <p className="text-sm text-muted-foreground">Adicione mais itens</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Coupon */}
          <div className="mt-4 flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Cupom de desconto"
              className="flex-1"
            />
            <Button variant="outline" className="text-primary border-primary hover:bg-primary/5">
              Aplicar
            </Button>
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between text-muted-foreground">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Delivery Time */}
          <div className="mt-6 flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-primary font-medium">PREVISÃO DE ENTREGA</p>
              <p className="font-bold">{restaurant?.delivery_time || '30-45 min'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSubmitOrder}
            disabled={!isStoreOpen || isSubmitting}
            className="w-full py-6 text-lg font-semibold rounded-full"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : !isStoreOpen ? (
              'Loja Fechada'
            ) : (
              `Enviar Pedido • ${formatCurrency(total)}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

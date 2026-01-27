import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Clock, Plus, Minus, Trash2, Pencil, ChevronRight, Store, Banknote, CreditCard, QrCode, TicketPercent, X, Check, Save, Star, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { usePublicRestaurantSettings } from '@/hooks/usePublicRestaurantSettings';
import { useCustomerAddresses, useSaveCustomerAddress, CustomerAddress } from '@/hooks/useCustomerAddresses';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { PhoneInput, isValidPhone } from '@/components/ui/phone-input';
import { CepInput, getCepDigits } from '@/components/ui/cep-input';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { toast } from '@/components/ui/app-toast';
import { useValidateCoupon, useUseCoupon, ValidateCouponResult } from '@/hooks/useCoupons';
import { useCreateOrder, OrderItem } from '@/hooks/useOrders';
import { useCustomerLoyalty, useLoyaltyRewards, useAddLoyaltyPoints, useRedeemPoints, LoyaltyReward } from '@/hooks/useLoyalty';
import { PixQRCode } from '@/components/checkout/PixQRCode';
import { SavedAddressSelector } from '@/components/checkout/SavedAddressSelector';
import { LoyaltyPointsDisplay } from '@/components/checkout/LoyaltyPointsDisplay';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().refine((val) => isValidPhone(val), { message: 'Telefone inválido (10 ou 11 dígitos)' }),
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
type OrderType = 'delivery' | 'pickup' | 'dine-in';
type OrderTypeSelection = OrderType | null;

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
}

interface AppliedReward {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  pointsUsed: number;
}

const CheckoutPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { restaurant, isLoading: restaurantLoading } = usePublicMenu(slug);
  const { data: restaurantSettings } = usePublicRestaurantSettings(restaurant?.id);
  const { items, getTotalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const validateCoupon = useValidateCoupon();
  const useCoupon = useUseCoupon();
  const createOrder = useCreateOrder();
  const saveAddress = useSaveCustomerAddress();
  const addLoyaltyPoints = useAddLoyaltyPoints();
  const redeemPoints = useRedeemPoints();

  const [orderType, setOrderType] = useState<OrderTypeSelection>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [changeFor, setChangeFor] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedReward, setAppliedReward] = useState<AppliedReward | null>(null);
  const [isRedeemingReward, setIsRedeemingReward] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Address fields
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  
  // Saved address state
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState('Casa');

  // Form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch saved addresses when phone changes
  const { data: savedAddresses = [], isLoading: addressesLoading } = useCustomerAddresses(
    restaurant?.id,
    customerPhone
  );

  // Fetch loyalty data
  const { data: customerLoyalty, refetch: refetchLoyalty } = useCustomerLoyalty(
    restaurant?.id,
    customerPhone
  );
  const { data: loyaltyRewards = [] } = useLoyaltyRewards(restaurant?.id);

  // Auto-fill name from saved address
  useEffect(() => {
    if (savedAddresses.length > 0 && !customerName) {
      const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      if (defaultAddress.customer_name) {
        setCustomerName(defaultAddress.customer_name);
      }
    }
  }, [savedAddresses, customerName]);

  // Show saved addresses or new form based on availability
  useEffect(() => {
    if (savedAddresses.length > 0 && !showNewAddressForm && !selectedAddressId) {
      const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];
      handleSelectAddress(defaultAddress);
    } else if (savedAddresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [savedAddresses]);

  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddressId(address.id);
    setCep(address.cep || '');
    setStreet(address.street);
    setNumber(address.number);
    setComplement(address.complement || '');
    setNeighborhood(address.neighborhood);
    setCity(address.city);
    setShowNewAddressForm(false);
    if (address.customer_name) {
      setCustomerName(address.customer_name);
    }
  };

  const handleShowNewAddressForm = () => {
    setSelectedAddressId(undefined);
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setShowNewAddressForm(true);
  };

  const subtotal = getTotalPrice();
  const deliveryFee = orderType === 'delivery' ? (restaurant?.delivery_fee || 0) : 0;
  
  // Calculate discount from coupon
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.discountType === 'percent'
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0;

  // Calculate discount from loyalty reward
  const rewardDiscount = appliedReward
    ? appliedReward.discountType === 'percent'
      ? (subtotal * appliedReward.discountValue) / 100
      : appliedReward.discountValue
    : 0;

  const discount = couponDiscount + rewardDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Calculate points that will be earned
  const pointsToEarn = restaurantSettings?.loyalty_enabled && total >= (restaurantSettings?.loyalty_min_order_for_points || 0)
    ? Math.floor(total * (restaurantSettings?.loyalty_points_per_real || 1))
    : 0;

  const isStoreOpen = restaurant?.is_open ?? false;

  const handleRedeemReward = async (reward: LoyaltyReward) => {
    if (!restaurant?.id || !customerPhone) return;
    
    setIsRedeemingReward(true);
    setSelectedRewardId(reward.id);
    
    try {
      const result = await redeemPoints.mutateAsync({
        restaurantId: restaurant.id,
        customerPhone,
        rewardId: reward.id,
      });

      if (result.success) {
        setAppliedReward({
          id: reward.id,
          name: reward.name,
          discountType: result.discount_type || 'fixed',
          discountValue: result.discount_value || 0,
          pointsUsed: reward.points_required,
        });
        refetchLoyalty();
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao resgatar recompensa');
    } finally {
      setIsRedeemingReward(false);
      setSelectedRewardId(undefined);
    }
  };

  const handleRemoveReward = () => {
    setAppliedReward(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !restaurant?.id) return;

    try {
      const result = await validateCoupon.mutateAsync({
        restaurantId: restaurant.id,
        code: couponCode,
        orderTotal: subtotal,
      });

      if (result.valid && result.coupon_id) {
        setAppliedCoupon({
          id: result.coupon_id,
          code: couponCode.toUpperCase(),
          discountType: result.discount_type!,
          discountValue: result.discount_value!,
        });
        setCouponCode('');
        toast.success('Cupom aplicado com sucesso!');
      } else {
        toast.error(result.error_message || 'Cupom inválido');
      }
    } catch (error) {
      toast.error('Erro ao validar cupom');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

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
    setCep(value);
  };

  const handleCepComplete = (cleanCep: string) => {
    fetchAddressByCep(cleanCep);
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
    if (!orderType) {
      toast.error('Escolha como deseja receber o pedido');
      return;
    }

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

    const orderTypeText = orderType === 'delivery' ? 'Entrega' : orderType === 'pickup' ? 'Retirada' : 'Consumir no local';
    const paymentMethodText = {
      cash: `Dinheiro${changeFor > 0 ? ` (Troco para ${formatCurrency(changeFor)})` : ''}`,
      debit: 'Débito',
      credit: 'Crédito',
      pix: 'Pix',
    }[paymentMethod];

    const fullAddress = orderType === 'delivery' 
      ? `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}, ${city} - CEP: ${cep}`
      : orderType === 'pickup' ? 'Retirada no local' : 'Consumir no local';

    const message = `🍔 *NOVO PEDIDO*

📋 *Itens:*
${orderItems}

💰 *Subtotal:* ${formatCurrency(subtotal)}
${appliedCoupon ? `🎟️ *Desconto (${appliedCoupon.code}):* -${formatCurrency(discount)}\n` : ''}${orderType === 'delivery' ? `🚚 *Taxa de entrega:* ${formatCurrency(deliveryFee)}\n` : ''}*Total:* ${formatCurrency(total)}

📍 *Tipo:* ${orderTypeText}
${orderType === 'delivery' ? `🏠 *Endereço:* ${fullAddress}\n` : ''}💳 *Pagamento:* ${paymentMethodText}

👤 *Cliente:* ${customerName}
📞 *Telefone:* ${customerPhone}`;

    const whatsappNumber = restaurant?.whatsapp?.replace(/\D/g, '') || restaurant?.phone?.replace(/\D/g, '');
    
    try {
      // Create order items
      const orderItems: OrderItem[] = items.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        productPrice: item.product.price,
        quantity: item.quantity,
        notes: item.notes,
        extras: item.extras?.map(e => ({
          groupId: e.groupId,
          groupTitle: e.groupTitle,
          optionId: e.optionId,
          optionName: e.optionName,
          price: e.price,
        })),
      }));

      // Create order in database
      const order = await createOrder.mutateAsync({
        restaurant_id: restaurant!.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: orderType === 'delivery' ? fullAddress : undefined,
        delivery_fee: deliveryFee,
        subtotal,
        discount,
        total,
        coupon_id: appliedCoupon?.id,
        payment_method: paymentMethod,
        payment_change: paymentMethod === 'cash' && changeFor > 0 ? changeFor : undefined,
        items: orderItems,
      });

      // Save new address if requested
      if (orderType === 'delivery' && saveNewAddress && !selectedAddressId && street && number && neighborhood && city) {
        try {
          await saveAddress.mutateAsync({
            restaurant_id: restaurant!.id,
            customer_phone: customerPhone,
            customer_name: customerName,
            label: addressLabel,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            is_default: savedAddresses.length === 0,
          });
        } catch (error) {
          console.error('Failed to save address:', error);
        }
      }

      // Increment coupon usage if one was applied
      if (appliedCoupon) {
        try {
          await useCoupon.mutateAsync(appliedCoupon.id);
        } catch (error) {
          console.error('Failed to increment coupon usage:', error);
        }
      }

      // Add loyalty points
      if (restaurantSettings?.loyalty_enabled && pointsToEarn > 0) {
        try {
          const earnedPoints = await addLoyaltyPoints.mutateAsync({
            restaurantId: restaurant!.id,
            customerPhone,
            customerName,
            orderId: order.id,
            orderTotal: total,
          });
          if (earnedPoints > 0) {
            toast.success(`Você ganhou ${earnedPoints} pontos de fidelidade!`);
          }
        } catch (error) {
          console.error('Failed to add loyalty points:', error);
        }
      }
      
      // Open WhatsApp if configured
      if (whatsappNumber) {
        const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      
      clearCart();
      toast.success('Pedido criado com sucesso!');
      
      // Redirect to order tracking page
      navigate(`/r/${slug}/order?id=${order.id}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Style like FloatingCart */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
        <button onClick={() => navigate(`/r/${slug}`)} className="p-1">
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </button>
        <h1 className="text-base font-bold uppercase tracking-wide">
          Finalizar Pedido
        </h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32">
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

        {/* Order Type Selection */}
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-primary text-primary-foreground rounded-t-xl px-4 py-3">
            <h3 className="font-semibold">Escolha como receber o pedido</h3>
          </div>

          {/* Warning if no selection */}
          {!orderType && (
            <div className="bg-zinc-800 text-white px-4 py-2 flex items-center gap-2 -mt-4 rounded-b-none">
              <span className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-xs">i</span>
              <span className="text-sm">Escolha uma opção para finalizar o pedido</span>
            </div>
          )}

          {/* Options */}
          <div className="border border-border rounded-xl overflow-hidden -mt-4">
            {/* Cadastrar endereço (delivery) */}
            <button
              onClick={() => setOrderType('delivery')}
              className={`w-full flex items-center justify-between p-4 border-b border-border transition-colors ${
                orderType === 'delivery' ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <span className="font-medium">Cadastrar endereço</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                orderType === 'delivery' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {orderType === 'delivery' && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>

            {/* Buscar o pedido (pickup) */}
            <button
              onClick={() => setOrderType('pickup')}
              className={`w-full flex items-center justify-between p-4 border-b border-border transition-colors ${
                orderType === 'pickup' ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <span className="font-medium">Buscar o pedido</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                orderType === 'pickup' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {orderType === 'pickup' && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>

            {/* Consumir no local (dine-in) */}
            <button
              onClick={() => setOrderType('dine-in')}
              className={`w-full flex items-center justify-between p-4 transition-colors ${
                orderType === 'dine-in' ? 'bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <span className="font-medium">Consumir no local</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                orderType === 'dine-in' ? 'border-primary bg-primary' : 'border-muted-foreground'
              }`}>
                {orderType === 'dine-in' && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </button>
          </div>

          {/* Delivery Address Section */}
          {orderType === 'delivery' && (
            <div className="space-y-4 pt-2">
              <h3 className="font-semibold">Endereço de entrega</h3>
              
              {/* Saved Addresses */}
              {customerPhone.replace(/\D/g, '').length >= 10 && savedAddresses.length > 0 && !showNewAddressForm && (
                <SavedAddressSelector
                  addresses={savedAddresses}
                  onSelect={handleSelectAddress}
                  onAddNew={handleShowNewAddressForm}
                  selectedAddressId={selectedAddressId}
                />
              )}

              {/* Loading addresses indicator */}
              {customerPhone.replace(/\D/g, '').length >= 10 && addressesLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Buscando endereços salvos...</span>
                </div>
              )}

              {/* New Address Form */}
              {(showNewAddressForm || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0];
                        handleSelectAddress(defaultAddress);
                      }}
                      className="text-primary"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Usar endereço salvo
                    </Button>
                  )}

                  <div>
                    <Label htmlFor="cep" className="text-muted-foreground">CEP</Label>
                    <div className="relative">
                      <CepInput
                        id="cep"
                        value={cep}
                        onChange={handleCepChange}
                        onCepComplete={handleCepComplete}
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

                  {/* Save address option */}
                  {customerPhone.replace(/\D/g, '').length >= 10 && (
                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="saveAddress"
                          checked={saveNewAddress}
                          onCheckedChange={(checked) => setSaveNewAddress(checked as boolean)}
                        />
                        <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                          Salvar este endereço para próximos pedidos
                        </Label>
                      </div>

                      {saveNewAddress && (
                        <div>
                          <Label htmlFor="addressLabel" className="text-muted-foreground text-sm">Apelido do endereço</Label>
                          <div className="flex gap-2 mt-1">
                            {['Casa', 'Trabalho', 'Apartamento', 'Outro'].map((label) => (
                              <button
                                key={label}
                                type="button"
                                onClick={() => setAddressLabel(label)}
                                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                  addressLabel === label
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Fee */}
              {street && number && (
                <div className="bg-muted/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{street}, {number}</p>
                      <p className="text-sm text-muted-foreground">{neighborhood}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-primary">{formatCurrency(deliveryFee)}</span>
                </div>
              )}
            </div>
          )}

          {/* Pickup Section */}
          {orderType === 'pickup' && (
            <div className="pt-2">
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
              <p className="text-sm text-green-600 font-medium mt-3 text-center">
                Taxa grátis retirando seu pedido na loja
              </p>
            </div>
          )}

          {/* Dine-in Section */}
          {orderType === 'dine-in' && (
            <div className="pt-2">
              <h3 className="font-semibold mb-3">Consumir no local</h3>
              <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
                <Store className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{restaurant?.address || 'Endereço não informado'}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seu pedido será preparado para consumo no local
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

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
              <PhoneInput
                id="phone"
                value={customerPhone}
                onChange={setCustomerPhone}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
            </div>
          </div>
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
          {appliedCoupon ? (
            <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <TicketPercent className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-sm text-green-600">
                    {appliedCoupon.discountType === 'percent' 
                      ? `${appliedCoupon.discountValue}% de desconto` 
                      : `R$ ${appliedCoupon.discountValue.toFixed(2).replace('.', ',')} de desconto`
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={handleRemoveCoupon}
                className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
              >
                <X className="w-4 h-4 text-green-700" />
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Cupom de desconto"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <Button 
                variant="outline" 
                className="text-primary border-primary hover:bg-primary/5"
                onClick={handleApplyCoupon}
                disabled={validateCoupon.isPending || !couponCode.trim()}
              >
                {validateCoupon.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Aplicar'
                )}
              </Button>
            </div>
          )}

          {/* Loyalty Points Display */}
          {restaurantSettings?.loyalty_enabled && customerPhone.replace(/\D/g, '').length >= 10 && (
            <div className="mt-4">
              <LoyaltyPointsDisplay
                loyalty={customerLoyalty}
                rewards={loyaltyRewards}
                onRedeemReward={handleRedeemReward}
                isRedeeming={isRedeemingReward}
                selectedRewardId={selectedRewardId}
                orderTotal={subtotal}
              />
            </div>
          )}

          {/* Applied Reward */}
          {appliedReward && (
            <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-amber-700">{appliedReward.name}</p>
                  <p className="text-sm text-amber-600">
                    {appliedReward.discountType === 'percent' 
                      ? `${appliedReward.discountValue}% de desconto` 
                      : `${formatCurrency(appliedReward.discountValue)} de desconto`
                    }
                  </p>
                </div>
              </div>
              <button 
                onClick={handleRemoveReward}
                className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
              >
                <X className="w-4 h-4 text-amber-700" />
              </button>
            </div>
          )}

          {/* Totals */}
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Desconto ({appliedCoupon.code})</span>
                <span>-{formatCurrency(couponDiscount)}</span>
              </div>
            )}
            {appliedReward && (
              <div className="flex justify-between text-amber-600">
                <span>Recompensa ({appliedReward.name})</span>
                <span>-{formatCurrency(rewardDiscount)}</span>
              </div>
            )}
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
            {pointsToEarn > 0 && (
              <div className="flex justify-between text-amber-600 text-sm">
                <span>⭐ Pontos que você vai ganhar</span>
                <span>+{pointsToEarn} pts</span>
              </div>
            )}
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
      </div>
      {/* Fixed Bottom Button - Style like FloatingCart */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Total do pedido</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
              <p className="text-sm text-muted-foreground">/ {items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>
          <button 
            onClick={handleSubmitOrder}
            disabled={!isStoreOpen || isSubmitting}
            className="bg-[hsl(221,83%,53%)] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[hsl(221,83%,48%)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : !isStoreOpen ? (
              'Loja Fechada'
            ) : (
              'Enviar Pedido'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

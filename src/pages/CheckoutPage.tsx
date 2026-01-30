import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Clock, Plus, Trash2, Pencil, ChevronRight, Store, Check, Star, X, Loader2, Banknote, CreditCard, TicketPercent } from 'lucide-react';
import pixLogo from '@/assets/pix-logo.png';

import { useCart } from '@/contexts/CartContext';
import { usePublicMenu } from '@/hooks/usePublicMenu';
import { usePublicRestaurantSettings } from '@/hooks/usePublicRestaurantSettings';
import { useCustomerAddresses, useSaveCustomerAddress, useUpdateCustomerAddress, useDeleteCustomerAddress, CustomerAddress } from '@/hooks/useCustomerAddresses';
import { formatCurrency } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CepInput } from '@/components/ui/cep-input';
import { isValidPhone } from '@/components/ui/phone-input';
import { z } from 'zod';
import { toast } from '@/components/ui/app-toast';
import { useValidateCoupon, useUseCoupon } from '@/hooks/useCoupons';
import { useCreateOrder, OrderItem } from '@/hooks/useOrders';
import { useCustomerLoyalty, useLoyaltyRewards, useAddLoyaltyPoints, useRedeemPoints, LoyaltyReward } from '@/hooks/useLoyalty';
import { CartItemEditSheet } from '@/components/menu/CartItemEditSheet';
import { CartItem, CartItemExtra } from '@/types/delivery';

// Import refactored components
import {
  CheckoutHeader,
  CustomerDataCard,
  CheckoutSummary,
  CheckoutFooter,
  PaymentMethodSelector,
  OrderReviewSection,
  ReviewInfoCards,
  StoreClosedAlert,
  LoyaltyPointsDisplay,
} from '@/components/checkout';

const customerSchema = z.object({
  name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  phone: z.string().refine((val) => isValidPhone(val), { message: 'Telefone inválido (10 ou 11 dígitos)' }),
});

type PaymentMethod = 'cash' | 'pix' | 'card' | '';
type PaymentTab = 'online' | 'delivery';
type OrderType = 'delivery' | 'pickup' | 'dine-in';
type OrderTypeSelection = OrderType | null;
type CheckoutStep = 'details' | 'payment' | 'review';

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
  const { restaurant, isLoading: restaurantLoading, extraGroups } = usePublicMenu(slug);
  const { data: restaurantSettings } = usePublicRestaurantSettings(restaurant?.id);
  const { items, getTotalPrice, updateQuantity, updateItem, removeItem, clearCart, setIsOpen } = useCart();
  const validateCoupon = useValidateCoupon();
  const useCoupon = useUseCoupon();
  const createOrder = useCreateOrder();
  const saveAddress = useSaveCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const addLoyaltyPoints = useAddLoyaltyPoints();
  const redeemPoints = useRedeemPoints();
  
  // Address editing state
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  // Cart item editing state
  const [editingCartItem, setEditingCartItem] = useState<CartItem | null>(null);
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number>(-1);

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('details');
  const [orderType, setOrderType] = useState<OrderTypeSelection>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentTab, setPaymentTab] = useState<PaymentTab>('online');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [changeFor, setChangeFor] = useState(0);
  const [noChangeNeeded, setNoChangeNeeded] = useState(false);
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
  const [addressFormAutoOpened, setAddressFormAutoOpened] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState('Casa');
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);

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
    if (addressesLoading) return;

    const validPhone = isValidPhone(customerPhone);
    if (!validPhone) {
      if (addressFormAutoOpened) setAddressFormAutoOpened(false);
      return;
    }

    if (savedAddresses.length > 0) {
      if (showNewAddressForm && !editingAddress && addressFormAutoOpened) {
        setShowNewAddressForm(false);
        setAddressFormAutoOpened(false);
      }

      if (!orderType) {
        setOrderType('delivery');
      }

      return;
    }

    if (orderType === 'delivery' && !showNewAddressForm && !editingAddress) {
      setShowNewAddressForm(true);
      setAddressFormAutoOpened(true);
    }
  }, [addressesLoading, savedAddresses, customerPhone, orderType, showNewAddressForm, addressFormAutoOpened, editingAddress]);

  // Calculate totals
  const subtotal = getTotalPrice();
  const deliveryFee = orderType === 'delivery' ? (restaurant?.delivery_fee || 0) : 0;
  
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.discountType === 'percent'
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0;

  const rewardDiscount = appliedReward
    ? appliedReward.discountType === 'percent'
      ? (subtotal * appliedReward.discountValue) / 100
      : appliedReward.discountValue
    : 0;

  const discount = couponDiscount + rewardDiscount;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const pointsToEarn = restaurantSettings?.loyalty_enabled && total >= (restaurantSettings?.loyalty_min_order_for_points || 0)
    ? Math.floor(total * (restaurantSettings?.loyalty_points_per_real || 1))
    : 0;

  const isStoreOpen = restaurant?.is_open ?? false;

  // Address handlers
  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddressId(address.id);
    setCep(address.cep || '');
    setStreet(address.street);
    setNumber(address.number);
    setComplement(address.complement || '');
    setNeighborhood(address.neighborhood);
    setCity(address.city);
    setShowNewAddressForm(false);
    setAddressFormAutoOpened(false);
    if (address.customer_name) {
      setCustomerName(address.customer_name);
    }
  };

  const handleShowNewAddressForm = () => {
    setSelectedAddressId(undefined);
    setEditingAddress(null);
    setAddressFormAutoOpened(false);
    setCep('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('');
    setShowNewAddressForm(true);
  };

  const handleEditAddress = (address: CustomerAddress) => {
    setEditingAddress(address);
    setSelectedAddressId(address.id);
    setAddressFormAutoOpened(false);
    setCep(address.cep || '');
    setStreet(address.street);
    setNumber(address.number);
    setComplement(address.complement || '');
    setNeighborhood(address.neighborhood);
    setCity(address.city);
    setAddressLabel(address.label);
    setIsDefaultAddress(address.is_default);
    setShowNewAddressForm(true);
  };

  const handleDeleteAddress = async (address: CustomerAddress) => {
    if (!restaurant?.id) return;
    
    try {
      await deleteAddress.mutateAsync({ id: address.id, restaurantId: restaurant.id });
      toast.success('Endereço excluído com sucesso');
      
      if (selectedAddressId === address.id) {
        setSelectedAddressId(undefined);
        setCep('');
        setStreet('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('');
      }
    } catch (error) {
      toast.error('Erro ao excluir endereço');
    }
  };

  const handleSaveAddress = async () => {
    if (!restaurant?.id || !street || !number || !neighborhood || !city) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          cep,
          street,
          number,
          complement,
          neighborhood,
          city,
          label: addressLabel,
          is_default: isDefaultAddress,
        });
        toast.success('Endereço atualizado com sucesso');
      } else {
        await saveAddress.mutateAsync({
          restaurant_id: restaurant.id,
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
        toast.success('Endereço salvo com sucesso');
      }
      
      setEditingAddress(null);
      setShowNewAddressForm(false);
    } catch (error) {
      toast.error('Erro ao salvar endereço');
    }
  };

  // CEP handler
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

  // Coupon handlers
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

  // Reward handlers
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

  // Form validation
  const validateForm = (): boolean => {
    const fieldErrors: Record<string, string> = {};

    try {
      customerSchema.parse({ name: customerName, phone: customerPhone });
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          fieldErrors[err.path[0] as string] = err.message;
        });
      }
    }

    setErrors(fieldErrors);
    return Object.keys(fieldErrors).length === 0;
  };

  // Submit order
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

    const fullAddress = orderType === 'delivery' 
      ? `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}, ${city} - CEP: ${cep}`
      : orderType === 'pickup' ? 'Retirada no local' : 'Consumir no local';

    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      productPrice: item.product.price,
      productImage: item.product.image,
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

    try {
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

      // Increment coupon usage
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
      const whatsappNumber = restaurant?.whatsapp?.replace(/\D/g, '') || restaurant?.phone?.replace(/\D/g, '');
      if (whatsappNumber) {
        const orderItemsText = items.map((item) => {
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
        const changeAmount = changeFor > 0 && changeFor >= total ? changeFor - total : 0;
        const paymentMethodText = {
          cash: `Dinheiro${changeFor > 0 ? ` (Troco para ${formatCurrency(changeFor)}${changeAmount > 0 ? ` - Troco: ${formatCurrency(changeAmount)}` : ''})` : ''}`,
          pix: 'Pix',
          card: 'Cartão',
        }[paymentMethod];

        const message = `🍔 *NOVO PEDIDO*

📋 *Itens:*
${orderItemsText}

💰 *Subtotal:* ${formatCurrency(subtotal)}
${appliedCoupon ? `🎟️ *Desconto (${appliedCoupon.code}):* -${formatCurrency(discount)}\n` : ''}${orderType === 'delivery' ? `🚚 *Taxa de entrega:* ${formatCurrency(deliveryFee)}\n` : ''}*Total:* ${formatCurrency(total)}

📍 *Tipo:* ${orderTypeText}
${orderType === 'delivery' ? `🏠 *Endereço:* ${fullAddress}\n` : ''}💳 *Pagamento:* ${paymentMethodText}

👤 *Cliente:* ${customerName}
📞 *Telefone:* ${customerPhone}`;

        const whatsappUrl = `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
      
      clearCart();
      toast.success('Pedido criado com sucesso!');
      navigate(`/r/${slug}/order?id=${order.id}&from=checkout`);
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Erro ao criar pedido. Tente novamente.');
    }

    setIsSubmitting(false);
  };

  // Navigation handlers
  const handleBack = () => {
    if (checkoutStep === 'review') {
      setCheckoutStep('payment');
    } else if (checkoutStep === 'payment') {
      setCheckoutStep('details');
    } else {
      setIsOpen(true);
      navigate(`/r/${slug}`);
    }
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};
    
    if (!orderType) {
      newErrors.orderType = 'Selecione o tipo de pedido';
      toast.error('Escolha como deseja receber o pedido');
      setErrors(newErrors);
      return;
    }
    
    const customerResult = customerSchema.safeParse({ name: customerName, phone: customerPhone });
    if (!customerResult.success) {
      customerResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        newErrors[field] = err.message;
      });
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Verifique os campos obrigatórios');
      return;
    }
    
    setCheckoutStep('payment');
  };

  const handleReview = () => {
    if (paymentMethod === 'cash' && !noChangeNeeded && changeFor > 0 && changeFor < total) {
      toast.error('O valor do troco deve ser maior que o total do pedido');
      return;
    }
    setCheckoutStep('review');
  };

  // Empty cart
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

  const fullAddress = orderType === 'delivery' && street
    ? `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}, ${city}`
    : '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader step={checkoutStep} onBack={handleBack} />

      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        {checkoutStep === 'payment' ? (
          <div className="max-w-lg mx-auto w-full">
            <PaymentMethodSelector
              paymentTab={paymentTab}
              paymentMethod={paymentMethod}
              changeFor={changeFor}
              noChangeNeeded={noChangeNeeded}
              total={total}
              onTabChange={setPaymentTab}
              onMethodChange={setPaymentMethod}
              onChangeForChange={setChangeFor}
              onNoChangeNeededChange={setNoChangeNeeded}
            />
            
            <div className="mx-4 mb-6">
              <CheckoutSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                discount={discount}
                total={total}
                isDelivery={orderType === 'delivery'}
              />
            </div>
          </div>
        ) : checkoutStep === 'review' ? (
          <div className="max-w-lg mx-auto w-full">
            <OrderReviewSection
              restaurant={restaurant}
              items={items}
              onAddMoreItems={() => {
                setCheckoutStep('details');
                setIsOpen(true);
                navigate(`/r/${slug}`);
              }}
              onEditItem={(item, index) => {
                setEditingCartItem(item);
                setEditingCartItemIndex(index);
              }}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
            />
            
            {/* Payment Section - Simplified */}
            <div className="px-4 pt-4">
              <h3 className="font-bold text-gray-900 mb-3">Pagamento pelo app</h3>
              <button
                onClick={() => setCheckoutStep('payment')}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {paymentMethod === 'pix' ? (
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
                    </div>
                  ) : paymentMethod === 'cash' ? (
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                  <span className="font-medium text-gray-900">
                    {paymentMethod === 'pix' ? 'Pix' : paymentMethod === 'cash' ? 'Dinheiro' : 'Cartão'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Coupon Section */}
            <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <TicketPercent className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Cupom</p>
                  <p className="text-sm text-gray-500">
                    {appliedCoupon?.code || 'Adicione um cupom'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCheckoutStep('details')}
                className="text-primary font-medium"
              >
                {appliedCoupon?.code ? 'Trocar' : 'Adicionar'}
              </button>
            </div>
            
            <div className="px-4 pt-2">
              <CheckoutSummary
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                discount={discount}
                total={total}
                isDelivery={orderType === 'delivery'}
              />
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto px-4 py-6 space-y-6 w-full">
            {!isStoreOpen && <StoreClosedAlert />}

            <CustomerDataCard
              customerName={customerName}
              customerPhone={customerPhone}
              onNameChange={setCustomerName}
              onPhoneChange={setCustomerPhone}
              errors={errors}
              setErrors={setErrors}
              addressesLoading={addressesLoading}
              savedAddressesCount={savedAddresses.length}
            />

            {/* Order Type Selection */}
            <div className="space-y-0">
              <div className="bg-primary text-primary-foreground rounded-t-2xl px-4 py-3.5">
                <h3 className="font-semibold text-base">Escolha como receber o pedido</h3>
              </div>

              {!orderType && (
                <div className="bg-zinc-800 text-white px-4 py-3 flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium">i</span>
                  </div>
                  <span className="text-sm">Escolha uma opção para finalizar o pedido</span>
                </div>
              )}

              <div className={`bg-white border border-gray-100 overflow-hidden ${(!orderType || showNewAddressForm || (orderType === 'delivery' && selectedAddressId && street && !showNewAddressForm)) ? '' : 'rounded-b-2xl'}`}>
                {/* Delivery Option */}
                <button
                  onClick={() => {
                    if (orderType === 'delivery') {
                      setOrderType(null);
                      return;
                    }
                    if (!customerName.trim() || !isValidPhone(customerPhone)) {
                      toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                      return;
                    }
                    setOrderType('delivery');
                    setEditingAddress(null);
                    setAddressFormAutoOpened(false);
                    setShowNewAddressForm(savedAddresses.length === 0);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50 ${orderType !== 'delivery' ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="font-medium text-gray-900">Entrega</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    orderType === 'delivery' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {orderType === 'delivery' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                  </div>
                </button>

                {/* Address Selection - simplified for brevity */}
                {orderType === 'delivery' && !showNewAddressForm && !selectedAddressId && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                    {addressesLoading ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedAddresses.map((address) => (
                          <button
                            key={address.id}
                            onClick={() => handleSelectAddress(address)}
                            className="w-full p-3 rounded-xl border border-gray-300 bg-white text-left hover:border-gray-400"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{address.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground ml-6">
                              {address.street}, {address.number}
                            </p>
                          </button>
                        ))}
                        <button
                          onClick={handleShowNewAddressForm}
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 bg-white hover:bg-muted/50"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Adicionar endereço</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Selected Address Display */}
                {orderType === 'delivery' && selectedAddressId && street && !showNewAddressForm && (
                  <div className="border-t border-gray-200 bg-white px-4 py-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-300 bg-gray-50">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">{street}, {number}</p>
                        <p className="text-sm text-muted-foreground">{neighborhood}, {city}{city ? ' - PB' : ''}</p>
                        {/* Delivery Time */}
                        {restaurantSettings && (
                          <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hoje, {restaurantSettings.min_delivery_time}-{restaurantSettings.max_delivery_time} min</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedAddressId(undefined)}
                        className="text-primary text-sm font-medium"
                      >
                        Trocar
                      </button>
                    </div>
                  </div>
                )}

                {/* Pickup Option */}
                <button
                  onClick={() => {
                    if (orderType === 'pickup') {
                      setOrderType(null);
                      return;
                    }
                    if (!customerName.trim() || !isValidPhone(customerPhone)) {
                      toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                      return;
                    }
                    setOrderType('pickup');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50 ${orderType !== 'pickup' ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="font-medium text-gray-900">Retirar no local</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    orderType === 'pickup' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {orderType === 'pickup' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                  </div>
                </button>

                {/* Dine-in Option */}
                <button
                  onClick={() => {
                    if (orderType === 'dine-in') {
                      setOrderType(null);
                      return;
                    }
                    if (!customerName.trim() || !isValidPhone(customerPhone)) {
                      toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                      return;
                    }
                    setOrderType('dine-in');
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">Consumir no local</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    orderType === 'dine-in' ? 'border-gray-900' : 'border-gray-300'
                  }`}>
                    {orderType === 'dine-in' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                  </div>
                </button>
              </div>

              {/* New Address Form */}
              {orderType === 'delivery' && showNewAddressForm && (
                <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl px-4 py-5 space-y-4">
                  <h4 className="font-semibold">{editingAddress ? 'Editar endereço' : 'Novo endereço'}</h4>
                  
                  <div>
                    <Label className="text-muted-foreground">CEP</Label>
                    <CepInput
                      value={cep}
                      onChange={setCep}
                      onCepComplete={fetchAddressByCep}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Rua</Label>
                      <Input value={street} onChange={(e) => setStreet(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Número</Label>
                      <Input value={number} onChange={(e) => setNumber(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Complemento (opcional)</Label>
                    <Input value={complement} onChange={(e) => setComplement(e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Bairro</Label>
                    <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Cidade</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>

                  <div className="flex gap-2">
                    {['Casa', 'Trabalho'].map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAddressLabel(label)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          addressLabel === label
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {!editingAddress && (
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="saveAddress"
                        checked={saveNewAddress}
                        onCheckedChange={(checked) => setSaveNewAddress(checked === true)}
                      />
                      <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                        Salvar endereço para próximos pedidos
                      </Label>
                    </div>
                  )}

                  {editingAddress && (
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="isDefault"
                        checked={isDefaultAddress}
                        onCheckedChange={(checked) => setIsDefaultAddress(checked === true)}
                      />
                      <Label htmlFor="isDefault" className="text-sm cursor-pointer flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        Definir como endereço padrão
                      </Label>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleSaveAddress}
                      disabled={!street || !number || !neighborhood || !city}
                      className="w-full"
                    >
                      {editingAddress ? 'Salvar alterações' : 'Salvar endereço'}
                    </Button>
                    {savedAddresses.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowNewAddressForm(false);
                          setEditingAddress(null);
                        }}
                      >
                        Voltar
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Pickup/Dine-in info */}
              {orderType === 'pickup' && (
                <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl p-4">
                  <div className="bg-muted/50 rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{restaurant?.address || 'Endereço não informado'}</p>
                      <p className="text-sm text-primary mt-1 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Previsão: {restaurant?.delivery_time || '30-45 min'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {orderType === 'dine-in' && (
                <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl p-4">
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

            {/* Loyalty Points */}
            {restaurantSettings?.loyalty_enabled && customerPhone.replace(/\D/g, '').length >= 10 && (
              <LoyaltyPointsDisplay
                loyalty={customerLoyalty}
                rewards={loyaltyRewards}
                onRedeemReward={handleRedeemReward}
                isRedeeming={isRedeemingReward}
                selectedRewardId={selectedRewardId}
                orderTotal={subtotal}
              />
            )}

            {/* Applied Reward */}
            {appliedReward && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4">
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
                  onClick={() => setAppliedReward(null)}
                  className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200"
                >
                  <X className="w-4 h-4 text-amber-700" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <CheckoutFooter
        step={checkoutStep}
        total={total}
        itemCount={items.reduce((acc, item) => acc + item.quantity, 0)}
        isDelivery={orderType === 'delivery'}
        isStoreOpen={isStoreOpen}
        isSubmitting={isSubmitting}
        onContinue={handleContinue}
        onReview={handleReview}
        onSubmit={handleSubmitOrder}
      />

      <CartItemEditSheet
        cartItem={editingCartItem}
        cartItemIndex={editingCartItemIndex}
        extraGroups={extraGroups}
        isOpen={!!editingCartItem}
        onClose={() => {
          setEditingCartItem(null);
          setEditingCartItemIndex(-1);
        }}
        onSave={(itemIndex, quantity, extras, notes) => {
          updateItem(itemIndex, quantity, extras, notes);
          setEditingCartItem(null);
          setEditingCartItemIndex(-1);
        }}
        onRemove={(itemIndex) => {
          removeItem(itemIndex);
          setEditingCartItem(null);
          setEditingCartItemIndex(-1);
        }}
      />
    </div>
  );
};

export default CheckoutPage;

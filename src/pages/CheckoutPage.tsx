import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, Clock, Plus, Minus, Trash2, Pencil, ChevronRight, Store, Banknote, CreditCard, QrCode, TicketPercent, X, Check, Save, Star, ArrowLeft } from 'lucide-react';
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
import { CartItemEditSheet } from '@/components/menu/CartItemEditSheet';
import { CartItem, CartItemExtra } from '@/types/delivery';

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

type PaymentMethod = 'cash' | 'pix' | 'card';
type PaymentTab = 'online' | 'delivery';
type OrderType = 'delivery' | 'pickup' | 'dine-in';
type OrderTypeSelection = OrderType | null;
type CheckoutStep = 'details' | 'address' | 'delivery-options' | 'payment' | 'review';

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
  // Helps distinguish auto-opening the address form (when we believed there were no saved addresses)
  // from the user explicitly choosing to add/edit an address.
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
  // When phone is valid and addresses are found, auto-select delivery and show addresses
  useEffect(() => {
    // Only run when addresses loading is complete
    if (addressesLoading) return;

    const validPhone = isValidPhone(customerPhone);
    if (!validPhone) {
      // Reset auto-open tracking when phone becomes invalid/empty
      if (addressFormAutoOpened) setAddressFormAutoOpened(false);
      return;
    }

    if (savedAddresses.length > 0) {
      // When addresses exist, close the form ONLY if it was auto-opened (not manually by user)
      // This ensures the addresses list shows instead of the form when auto-opened
      if (showNewAddressForm && !editingAddress && addressFormAutoOpened) {
        setShowNewAddressForm(false);
        setAddressFormAutoOpened(false);
      }

      // Auto-select delivery when addresses exist and user hasn't chosen an order type yet.
      if (!orderType) {
        setOrderType('delivery');
      }

      return;
    }

    // No saved addresses: if user chose delivery, auto-open the form
    if (orderType === 'delivery' && !showNewAddressForm && !editingAddress) {
      setShowNewAddressForm(true);
      setAddressFormAutoOpened(true);
    }
  }, [addressesLoading, savedAddresses, customerPhone, orderType, showNewAddressForm, addressFormAutoOpened, editingAddress]);

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
      
      // If deleted the selected address, clear selection
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
        // Update existing address
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
        // Save new address
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
    const changeAmount = changeFor > 0 && changeFor >= total ? changeFor - total : 0;
    const paymentMethodText = {
      cash: `Dinheiro${changeFor > 0 ? ` (Troco para ${formatCurrency(changeFor)}${changeAmount > 0 ? ` - Troco: ${formatCurrency(changeAmount)}` : ''})` : ''}`,
      pix: 'Pix',
      card: 'Cartão',
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

  // Don't show loading spinner - render immediately with what we have

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
        <button 
          type="button"
          onClick={() => {
            if (checkoutStep === 'review') {
              setCheckoutStep('payment');
            } else if (checkoutStep === 'payment') {
              setCheckoutStep('details');
            } else {
              setIsOpen(true);
              navigate(`/r/${slug}`);
            }
          }}
          className="p-2 -ml-2 touch-manipulation"
        >
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </button>
        <h1 className="text-base font-bold uppercase tracking-wide">
          {checkoutStep === 'review' ? 'Sacola' : checkoutStep === 'payment' ? 'Pagamento' : 'Finalizar Pedido'}
        </h1>
        <div className="w-6" /> {/* Spacer for centering */}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        {checkoutStep === 'payment' ? (
          /* Payment Step Content - iFood style with tabs */
          <div className="max-w-lg mx-auto w-full">
            {/* Payment Tabs - iFood Style */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  setPaymentTab('online');
                  setPaymentMethod('pix');
                }}
                className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                  paymentTab === 'online' 
                    ? 'text-primary' 
                    : 'text-gray-500'
                }`}
              >
                Pagar pelo app
                {paymentTab === 'online' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => {
                  setPaymentTab('delivery');
                  setPaymentMethod('cash');
                }}
                className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                  paymentTab === 'delivery' 
                    ? 'text-primary' 
                    : 'text-gray-500'
                }`}
              >
                Pagar na entrega
                {paymentTab === 'delivery' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
            
            <div className="px-4 py-6 space-y-3">
              {paymentTab === 'online' ? (
                /* Pagar pelo app - Online payment options */
                <>
                  {/* Pix */}
                  <button
                    onClick={() => setPaymentMethod('pix')}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
                      paymentMethod === 'pix' ? 'border-gray-900' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-gray-900">Pix</span>
                        <p className="text-sm text-gray-500">Aprovação automática</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'pix' ? 'border-gray-900' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'pix' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                    </div>
                  </button>
                </>
              ) : (
                /* Pagar na entrega - Delivery payment options */
                <>
                  {/* Dinheiro */}
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
                      paymentMethod === 'cash' ? 'border-gray-900' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Banknote className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Dinheiro</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cash' ? 'border-gray-900' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                    </div>
                  </button>


                  {/* Cartão */}
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl border bg-white ${
                      paymentMethod === 'card' ? 'border-gray-900' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">Cartão</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-gray-900' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                    </div>
                  </button>
                </>
              )}
            </div>

            {/* Change for cash - only show when cash is selected */}
            {paymentMethod === 'cash' && (
              <div className="mx-4 mb-6">
                <p className="text-gray-700 mb-3">Precisa de troco?</p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">Troco para:</span>
                  <CurrencyInput
                    value={changeFor}
                    onChange={setChangeFor}
                    className="flex-1 bg-gray-100 border-0 rounded-lg px-3 py-2.5 text-base focus:ring-0 placeholder:text-gray-400"
                    placeholder="Valor"
                  />
                </div>

                {/* Validation messages */}
                {changeFor > 0 && changeFor < total && (
                  <p className="text-sm text-red-600 mt-2">⚠️ O valor deve ser maior que {formatCurrency(total)}</p>
                )}

                {changeFor > 0 && changeFor >= total && (
                  <p className="text-sm text-green-600 mt-2">✓ Troco: {formatCurrency(changeFor - total)}</p>
                )}
              </div>
            )}

            {/* Order Summary - iFood Style */}
            <div className="mx-4 mb-6 space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Resumo de valores</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxa de entrega</span>
                  {orderType === 'delivery' ? (
                    deliveryFee > 0 ? (
                      <span className="text-gray-900">{formatCurrency(deliveryFee)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Grátis</span>
                    )
                  ) : (
                    <span className="text-green-600 font-medium">Grátis</span>
                  )}
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Desconto</span>
                    <span className="text-green-600 font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

          </div>
        ) : checkoutStep === 'review' ? (
          /* Review Step - iFood Style Sacola */
          <div className="max-w-lg mx-auto w-full">
            {/* Restaurant Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
              {restaurant?.logo && (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="font-bold text-gray-900">{restaurant?.name}</p>
                <button 
                  onClick={() => {
                    setCheckoutStep('details');
                    setIsOpen(true);
                    navigate(`/r/${slug}`);
                  }}
                  className="text-primary text-sm font-medium"
                >
                  Adicionar mais itens
                </button>
              </div>
            </div>

            {/* Cart Items Section */}
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900 mb-3">Itens do pedido</h3>
              <div className="space-y-3">
                {items.map((item, index) => {
                  const extrasTotal = item.extras?.reduce((sum, extra) => sum + extra.price * (extra.quantity || 1), 0) || 0;
                  const itemPrice = (item.product.price + extrasTotal) * item.quantity;
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      {/* Image - Clickable to edit */}
                      {item.product.image && (
                        <button 
                          onClick={() => {
                            setEditingCartItem(item);
                            setEditingCartItemIndex(index);
                          }}
                          className="shrink-0"
                        >
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          {/* Name/Description - Clickable to edit */}
                          <button 
                            onClick={() => {
                              setEditingCartItem(item);
                              setEditingCartItemIndex(index);
                            }}
                            className="flex-1 min-w-0 text-left"
                          >
                            <p className="font-medium text-gray-900 text-sm">{item.quantity}x {item.product.name}</p>
                            {item.product.description && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                {item.product.description}
                              </p>
                            )}
                          </button>
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-0 bg-muted rounded-lg overflow-hidden shrink-0">
                            <button
                              onClick={() => updateQuantity(index, item.quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center text-[hsl(221,83%,53%)] hover:bg-muted/80 transition-colors"
                            >
                              {item.quantity === 1 ? (
                                <Trash2 className="w-4 h-4" />
                              ) : (
                                <Minus className="w-4 h-4" />
                              )}
                            </button>
                            <span className="w-8 text-center font-semibold text-sm text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(index, item.quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center text-[hsl(221,83%,53%)] hover:bg-muted/80 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Extras - Clickable to edit */}
                        {item.extras && item.extras.length > 0 && (
                          <button 
                            onClick={() => {
                              setEditingCartItem(item);
                              setEditingCartItemIndex(index);
                            }}
                            className="text-left w-full"
                          >
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {item.extras.map(e => e.optionName).join(', ')}
                            </p>
                          </button>
                        )}
                        {/* Notes - Clickable to edit */}
                        {item.notes && (
                          <button 
                            onClick={() => {
                              setEditingCartItem(item);
                              setEditingCartItemIndex(index);
                            }}
                            className="text-left w-full"
                          >
                            <p className="text-xs text-gray-500 italic mt-0.5">{item.notes}</p>
                          </button>
                        )}
                        {/* Price - Clickable to edit */}
                        <button 
                          onClick={() => {
                            setEditingCartItem(item);
                            setEditingCartItemIndex(index);
                          }}
                          className="text-left"
                        >
                          <p className="font-medium text-gray-900 text-sm mt-1">
                            {formatCurrency(itemPrice)}
                          </p>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Method Section */}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-3">Pagamento pelo app</h3>
              <button
                onClick={() => {
                  setCheckoutStep('payment');
                }}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  {paymentMethod === 'pix' ? (
                    <>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img src={pixLogo} alt="Pix" width={32} height={32} className="w-8 h-8 object-contain" loading="eager" />
                      </div>
                      <span className="font-medium text-gray-900">Pix</span>
                    </>
                  ) : paymentMethod === 'cash' ? (
                    <>
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-medium text-gray-900">Dinheiro</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                      </div>
                      <span className="font-medium text-gray-900">Cartão</span>
                    </>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Coupon Section */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <TicketPercent className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">Cupom</p>
                  <p className="text-sm text-gray-500">
                    {appliedCoupon ? appliedCoupon.code : 'Adicione um cupom'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCheckoutStep('details');
                }}
                className="text-primary font-medium"
              >
                {appliedCoupon ? 'Trocar' : 'Adicionar'}
              </button>
            </div>

            {/* Order Summary */}
            <div className="p-4 space-y-4">
              <h3 className="font-bold text-lg text-gray-900">Resumo de valores</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Taxa de entrega</span>
                  {orderType === 'delivery' ? (
                    deliveryFee > 0 ? (
                      <span className="text-gray-900">{formatCurrency(deliveryFee)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Grátis</span>
                    )
                  ) : (
                    <span className="text-green-600 font-medium">Grátis</span>
                  )}
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Desconto</span>
                    <span className="text-green-600 font-medium">-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6 w-full">
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

        {/* Customer Data - Styled Card */}
        <div className="overflow-hidden">
          {/* Blue Header */}
          <div className="bg-[hsl(221,83%,53%)] text-white rounded-t-2xl px-4 py-3.5">
            <h3 className="font-semibold text-base">Dados do cliente</h3>
          </div>
          <div className="bg-white border border-t-0 border-gray-100 rounded-b-2xl px-4 py-5 space-y-4">
            <div>
              <Label htmlFor="name" className="text-xs text-gray-500 font-normal mb-1.5 block">Nome completo</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  if (e.target.value.trim().length >= 2 && errors.name) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.name;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Seu nome"
                className={`h-12 border border-input rounded-xl bg-white px-4 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[hsl(221,83%,53%)] focus-visible:ring-offset-2 ${errors.name ? 'border-destructive' : ''}`}
              />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="phone" className="text-xs text-gray-500 font-normal mb-1.5 block">Telefone</Label>
              <div className="relative">
                <PhoneInput
                  id="phone"
                  value={customerPhone}
                  onChange={(value) => {
                    setCustomerPhone(value);
                    if (isValidPhone(value) && errors.phone) {
                      setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.phone;
                        return newErrors;
                      });
                    }
                  }}
                  className={`h-12 border border-input rounded-xl bg-white px-4 text-gray-900 placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[hsl(221,83%,53%)] focus-visible:ring-offset-2 ${errors.phone ? 'border-destructive' : ''}`}
                />
                {isValidPhone(customerPhone) && addressesLoading && (
                  <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
                {isValidPhone(customerPhone) && !addressesLoading && savedAddresses.length > 0 && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              {isValidPhone(customerPhone) && !addressesLoading && savedAddresses.length > 0 && (
                <p className="text-xs text-green-600 mt-1.5">
                  {savedAddresses.length} endereço{savedAddresses.length > 1 ? 's' : ''} encontrado{savedAddresses.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </div>


        {/* Order Type Selection - iFood Style - Always show on details step */}
        {checkoutStep === 'details' && (
          <div className="space-y-0">
            {/* Blue Header */}
            <div className="bg-[hsl(221,83%,53%)] text-white rounded-t-2xl px-4 py-3.5">
              <h3 className="font-semibold text-base">Escolha como receber o pedido</h3>
            </div>

            {/* Dark Info Bar */}
            {!orderType && (
              <div className="bg-zinc-800 text-white px-4 py-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/70 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium">i</span>
                </div>
                <span className="text-sm">Escolha uma opção para finalizar o pedido</span>
              </div>
            )}

            {/* Options Card */}
            <div className={`bg-white border border-gray-100 overflow-hidden ${(!orderType || showNewAddressForm || (orderType === 'delivery' && selectedAddressId && street && !showNewAddressForm)) ? '' : 'rounded-b-2xl'}`}>
            {/* Entrega / Delivery */}
              <button
                onClick={() => {
                  if (!customerName.trim() || !isValidPhone(customerPhone)) {
                    toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                    return;
                  }
                  setOrderType('delivery');
                  // Default behavior: when there are saved addresses, show the list (not the form)
                  // so users can pick quickly.
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

              {/* Saved Addresses - Shows only when no address is selected */}
              {orderType === 'delivery' && !showNewAddressForm && !selectedAddressId && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  {addressesLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Buscando endereços...</span>
                    </div>
                  ) : (
                    <div className="px-4 py-3 space-y-3">
                      <div>
                        <h4 className="font-semibold text-base">Selecione um endereço</h4>
                        <p className="text-sm text-muted-foreground">Endereços salvos</p>
                      </div>
                      
                      {savedAddresses.length > 0 ? (
                        <div className="space-y-2">
                          {savedAddresses.map((address) => (
                            <div
                              key={address.id}
                              className={`w-full p-3 rounded-xl border transition-all bg-white ${
                                selectedAddressId === address.id
                                  ? 'border-gray-900'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => {
                                    handleSelectAddress(address);
                                  }}
                                  className="flex-1 flex items-start gap-3 text-left"
                                >
                                  <div className={`mt-0.5 text-muted-foreground`}>
                                    {address.label.toLowerCase() === 'casa' ? (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    ) : (
                                      <MapPin className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{address.label}</span>
                                      {address.is_default && (
                                        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                                          Padrão
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {address.street}, {address.number}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {address.neighborhood}, {address.city}
                                    </p>
                                  </div>
                                  {selectedAddressId === address.id && (
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                  )}
                                </button>
                                
                                {/* Action buttons */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAddress(address);
                                    }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-[#FF9500] hover:bg-orange-50 transition-colors"
                                    aria-label="Editar endereço"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAddress(address);
                                    }}
                                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                    aria-label="Excluir endereço"
                                    disabled={deleteAddress.isPending}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {/* Add new address button */}
                          <button
                            onClick={() => handleShowNewAddressForm()}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 bg-white hover:bg-muted/50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="font-medium">Usar outro endereço</span>
                          </button>
                        </div>
                      ) : (
                        /* No saved addresses - show prompt to add */
                        <button
                          onClick={() => handleShowNewAddressForm()}
                          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 bg-white hover:bg-muted/50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium">Adicionar endereço</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Delivery Options - Shows only when address is selected */}
              {orderType === 'delivery' && selectedAddressId && street && !showNewAddressForm && (
                <div className="border-t border-gray-200 bg-white px-4 py-4 space-y-4">
                  {/* Selected Address Display */}
                  <div>
                    <h4 className="font-semibold text-base mb-2">Entregar no endereço</h4>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">{street}, {number}</p>
                          <p className="text-xs text-muted-foreground">{neighborhood}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedAddressId(undefined)}
                        className="text-orange-500 text-sm font-medium"
                      >
                        Trocar
                      </button>
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Opções de entrega</h4>
                    
                    {/* Standard Delivery */}
                    <div className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-300">
                      <div className="text-left">
                        <p className="font-semibold text-sm">Padrão</p>
                        <p className="text-xs text-muted-foreground">Hoje, {restaurantSettings?.min_delivery_time || 30}-{restaurantSettings?.max_delivery_time || 45} min</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatCurrency(deliveryFee)}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-[#FF9500] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
                        </div>
                      </div>
                    </div>

                    {/* Pickup Alternative */}
                    <button
                      onClick={() => {
                        setOrderType('pickup');
                        setSelectedAddressId(undefined);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-semibold">Taxa grátis</span>
                        <span className="text-muted-foreground">retirando seu pedido na loja</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )}

              {/* Buscar o pedido */}
              <button
                onClick={() => {
                  if (!customerName.trim() || !isValidPhone(customerPhone)) {
                    toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                    return;
                  }
                  setOrderType('pickup');
                }}
                className="w-full flex items-center justify-between px-4 py-4 border-t border-b border-gray-100 transition-colors hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Buscar o pedido</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  orderType === 'pickup' ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {orderType === 'pickup' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                </div>
              </button>

              {/* Consumir no local */}
              <button
                onClick={() => {
                  if (!customerName.trim() || !isValidPhone(customerPhone)) {
                    toast.error('Preencha seu nome e telefone antes de escolher como receber o pedido');
                    return;
                  }
                  setOrderType('dine-in');
                }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-b-2xl transition-colors hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">Consumir no local</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  orderType === 'dine-in' ? 'border-gray-900' : 'border-gray-300'
                }`}>
                  {orderType === 'dine-in' && <div className="w-3 h-3 rounded-full bg-gray-900" />}
                </div>
              </button>
            </div>

            {/* New/Edit Address Form - Shows when adding new address */}
            {orderType === 'delivery' && showNewAddressForm && (
              <div className="pt-4 space-y-4">
                <h3 className="font-semibold text-lg">
                  {editingAddress ? 'Editar endereço' : 'Novo endereço'}
                </h3>
                <div>
                  <Label htmlFor="cep-inline" className="text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <CepInput
                      id="cep-inline"
                      value={cep}
                      onChange={handleCepChange}
                      onCepComplete={handleCepComplete}
                      className={errors.cep ? 'border-destructive' : ''}
                    />
                    {isLoadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="street-inline" className="text-muted-foreground">Rua</Label>
                  <Input
                    id="street-inline"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Nome da rua"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number-inline" className="text-muted-foreground">Número</Label>
                    <Input
                      id="number-inline"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement-inline" className="text-muted-foreground">Complemento</Label>
                    <Input
                      id="complement-inline"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto, bloco..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood-inline" className="text-muted-foreground">Bairro</Label>
                  <Input
                    id="neighborhood-inline"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Nome do bairro"
                  />
                </div>

                <div>
                  <Label htmlFor="city-inline" className="text-muted-foreground">Cidade</Label>
                  <Input
                    id="city-inline"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade - UF"
                  />
                </div>

                {/* Address Label */}
                <div>
                  <Label className="text-muted-foreground">Nome do endereço</Label>
                  <div className="flex gap-2 mt-2">
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
                </div>

                {/* Save Address Option - Only for new addresses */}
                {!editingAddress && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="saveAddress-inline"
                      checked={saveNewAddress}
                      onCheckedChange={(checked) => setSaveNewAddress(checked === true)}
                    />
                    <Label 
                      htmlFor="saveAddress-inline" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Salvar endereço para próximos pedidos
                    </Label>
                  </div>
                )}

                {/* Set as default option - Only when editing */}
                {editingAddress && (
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="isDefaultAddress-inline"
                      checked={isDefaultAddress}
                      onCheckedChange={(checked) => setIsDefaultAddress(checked === true)}
                    />
                    <Label 
                      htmlFor="isDefaultAddress-inline" 
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      <Star className="w-4 h-4 text-amber-500" />
                      Definir como endereço padrão
                    </Label>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={async () => {
                      if (!street || !number || !neighborhood || !city) {
                        toast.error('Preencha todos os campos obrigatórios');
                        return;
                      }
                      
                      try {
                        if (editingAddress) {
                          await handleSaveAddress();
                        } else if (saveNewAddress && restaurant?.id && customerPhone) {
                          // Save new address
                          const cleanPhone = customerPhone.replace(/\D/g, '');
                          await saveAddress.mutateAsync({
                            restaurant_id: restaurant.id,
                            customer_phone: cleanPhone,
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
                        
                        // Stay on same page and show saved addresses list
                        setShowNewAddressForm(false);
                        setEditingAddress(null);
                      } catch (error) {
                        toast.error('Erro ao salvar endereço');
                      }
                    }}
                    disabled={updateAddress.isPending || saveAddress.isPending || !street || !number || !neighborhood || !city}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    {(updateAddress.isPending || saveAddress.isPending) ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {editingAddress ? 'Salvar alterações' : 'Salvar endereço'}
                  </Button>
                  {savedAddresses.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowNewAddressForm(false);
                        setEditingAddress(null);
                      }}
                      className="w-full"
                    >
                      Voltar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Section */}
            {orderType === 'pickup' && (
              <div className="pt-4">
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
              <div className="pt-4">
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
        )}



        {/* Loyalty Points Display */}
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
              onClick={handleRemoveReward}
              className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center hover:bg-amber-200 transition-colors"
            >
              <X className="w-4 h-4 text-amber-700" />
            </button>
          </div>
        )}
        </div>
        )}
      </div>
      {/* Fixed Bottom Button - iFood Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto">
          {checkoutStep === 'details' ? (
            <>
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{orderType === 'delivery' ? 'Total com a entrega' : 'Total do pedido'}</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                    <p className="text-sm text-muted-foreground">/ {items.reduce((acc, item) => acc + item.quantity, 0)} {items.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'itens'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    // Validate customer info
                    const newErrors: Record<string, string> = {};
                    
                    // Validate order type
                    if (!orderType) {
                      newErrors.orderType = 'Selecione o tipo de pedido';
                      toast.error('Escolha como deseja receber o pedido');
                      setErrors(newErrors);
                      return;
                    }
                    
                    // Validate customer info
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
                    
                    // Go directly to payment
                    setCheckoutStep('payment');
                  }}
                  disabled={!isStoreOpen}
                  className="bg-[hsl(221,83%,53%)] text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-[hsl(221,83%,48%)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isStoreOpen ? 'Loja Fechada' : 'Continuar'}
                </button>
              </div>
            </>
          ) : checkoutStep === 'payment' ? (
            <div className="px-4 py-3">
              <button 
                onClick={() => {
                  setCheckoutStep('review');
                }}
                disabled={!isStoreOpen}
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {!isStoreOpen ? (
                  'Loja Fechada'
                ) : (
                  <>
                    <span>Revisar pedido</span>
                    <span className="font-bold">• {formatCurrency(total)}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="px-4 py-3">
              <button 
                onClick={handleSubmitOrder}
                disabled={!isStoreOpen || isSubmitting}
                className="w-full bg-primary text-white font-semibold py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : !isStoreOpen ? (
                  'Loja Fechada'
                ) : (
                  <>
                    <span>Enviar pedido</span>
                    <span className="font-bold">• {formatCurrency(total)}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart Item Edit Sheet */}
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

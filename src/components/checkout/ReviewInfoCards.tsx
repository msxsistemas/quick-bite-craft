import { MapPin, ChevronRight, Banknote, CreditCard, TicketPercent } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import pixLogo from '@/assets/pix-logo.png';

type PaymentMethod = 'cash' | 'pix' | 'card' | '';
type OrderType = 'delivery' | 'pickup' | 'dine-in';

interface ReviewInfoCardsProps {
  orderType: OrderType;
  address: string;
  paymentMethod: PaymentMethod;
  noChangeNeeded: boolean;
  changeFor: number;
  appliedCouponCode: string | null;
  onEditAddress: () => void;
  onEditPayment: () => void;
  onEditCoupon: () => void;
}

export const ReviewInfoCards: React.FC<ReviewInfoCardsProps> = ({
  orderType,
  address,
  paymentMethod,
  noChangeNeeded,
  changeFor,
  appliedCouponCode,
  onEditAddress,
  onEditPayment,
  onEditCoupon,
}) => {
  const getOrderTypeLabel = () => {
    switch (orderType) {
      case 'delivery':
        return 'Entrega';
      case 'pickup':
        return 'Retirada';
      case 'dine-in':
        return 'Consumir no local';
      default:
        return '';
    }
  };

  return (
    <>
      {/* Delivery/Pickup Info */}
      <button 
        onClick={onEditAddress}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-gray-600" />
          <div className="text-left">
            <p className="font-semibold text-gray-900">{getOrderTypeLabel()}</p>
            {orderType === 'delivery' && address && (
              <p className="text-sm text-gray-500 max-w-[250px] truncate">{address}</p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </button>

      {/* Payment Info */}
      <button 
        onClick={onEditPayment}
        className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-100"
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
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900">Dinheiro</span>
                <span className="text-sm text-gray-500">
                  {noChangeNeeded ? 'Sem troco' : changeFor > 0 ? `Troco para ${formatCurrency(changeFor)}` : 'Sem troco'}
                </span>
              </div>
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

      {/* Coupon Section */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <TicketPercent className="w-6 h-6 text-gray-600" />
          <div>
            <p className="font-semibold text-gray-900">Cupom</p>
            <p className="text-sm text-gray-500">
              {appliedCouponCode || 'Adicione um cupom'}
            </p>
          </div>
        </div>
        <button 
          onClick={onEditCoupon}
          className="text-primary font-medium"
        >
          {appliedCouponCode ? 'Trocar' : 'Adicionar'}
        </button>
      </div>
    </>
  );
};

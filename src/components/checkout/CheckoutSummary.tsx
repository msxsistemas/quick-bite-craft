import { formatCurrency } from '@/lib/format';

interface CheckoutSummaryProps {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  isDelivery: boolean;
}

export const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  subtotal,
  deliveryFee,
  discount,
  total,
  isDelivery,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-lg text-gray-900">Resumo de valores</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-gray-900">{formatCurrency(subtotal)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Taxa de entrega</span>
          {isDelivery ? (
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
  );
};

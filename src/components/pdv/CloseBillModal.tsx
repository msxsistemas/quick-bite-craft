import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Receipt, CreditCard, Banknote, QrCode, DollarSign, Loader2, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Order, OrderItem } from '@/hooks/useOrders';

interface CloseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  tableName: string;
  onConfirmPayment: (paymentMethod: string, tipAmount: number) => Promise<void>;
  isProcessing: boolean;
}

export const CloseBillModal = ({
  isOpen,
  onClose,
  order,
  tableName,
  onConfirmPayment,
  isProcessing,
}: CloseBillModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState(order?.payment_method || 'dinheiro');
  const [tipAmount, setTipAmount] = useState<string>(order?.tip_amount?.toString() || '0');
  const [tipPercentage, setTipPercentage] = useState<number | null>(null);

  const orderSubtotal = order?.subtotal || 0;
  const orderDiscount = order?.discount || 0;
  const currentTip = parseFloat(tipAmount) || 0;
  const finalTotal = orderSubtotal - orderDiscount + currentTip;

  const handleTipPercentageClick = (percentage: number) => {
    setTipPercentage(percentage);
    const calculatedTip = (orderSubtotal * percentage) / 100;
    setTipAmount(calculatedTip.toFixed(2));
  };

  const handleConfirm = async () => {
    await onConfirmPayment(paymentMethod, currentTip);
  };

  const paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
    { value: 'pix', label: 'PIX', icon: QrCode },
    { value: 'credito', label: 'Crédito', icon: CreditCard },
    { value: 'debito', label: 'Débito', icon: CreditCard },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Fechar Conta - {tableName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Items */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Itens do Pedido</Label>
            <ScrollArea className="h-[180px] border rounded-lg p-3">
              {order?.items && order.items.length > 0 ? (
                <div className="space-y-2">
                  {order.items.map((item: OrderItem, index: number) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.quantity}x</span>{' '}
                        <span>{item.productName}</span>
                        {item.extras && item.extras.length > 0 && (
                          <div className="text-xs text-muted-foreground ml-4">
                            {item.extras.map((extra, idx) => (
                              <span key={idx}>
                                + {extra.optionName}
                                {idx < item.extras!.length - 1 && ', '}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.productPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item no pedido
                </p>
              )}
            </ScrollArea>
          </div>

          <Separator />

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Forma de Pagamento</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.value}
                  type="button"
                  variant={paymentMethod === method.value ? 'default' : 'outline'}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-xs">{method.label}</span>
                </Button>
              ))}
            </div>
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
                  variant={tipPercentage === percentage ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTipPercentageClick(percentage)}
                  className="flex-1"
                >
                  {percentage}%
                </Button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
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

          {/* Total Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(orderSubtotal)}</span>
            </div>
            {orderDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto:</span>
                <span>-{formatCurrency(orderDiscount)}</span>
              </div>
            )}
            {currentTip > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span>Gorjeta:</span>
                <span>+{formatCurrency(currentTip)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={isProcessing}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} className="flex-1" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from 'react';
import { ArrowLeft, Home, Printer, Trash2, MoreVertical, Diamond, DollarSign, CreditCard, Minus, Plus, AlertCircle, HelpCircle, X, Pencil, RefreshCw, Camera } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Order } from '@/hooks/useOrders';
import { PaymentSheet } from './PaymentSheet';
import { CloseTableConfirmDialog } from './CloseTableConfirmDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface Payment {
  id: string;
  method: string;
  amount: number;
  serviceFee: number;
  status: 'pending' | 'completed' | 'expired';
}

interface WaiterCloseBillViewProps {
  tableName: string;
  orders: Order[];
  restaurantId: string;
  onBack: () => void;
  onGoToMap: () => void;
  onPrint: () => void;
  onConfirmPayment: (method: string, amount: number) => void;
  onCloseTable: () => void;
  serviceFeePercentage?: number;
}

export const WaiterCloseBillView = ({
  tableName,
  orders,
  restaurantId,
  onBack,
  onGoToMap,
  onPrint,
  onConfirmPayment,
  onCloseTable,
  serviceFeePercentage = 10,
}: WaiterCloseBillViewProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [splitCount, setSplitCount] = useState(1);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('cartao');
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [removeAllSheetOpen, setRemoveAllSheetOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const serviceFee = (subtotal * serviceFeePercentage) / 100;
  const total = subtotal + serviceFee;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount + p.serviceFee, 0);
  const totalServiceFeePaid = payments.reduce((sum, p) => sum + p.serviceFee, 0);
  const remaining = total - totalPaid;
  const amountPerPerson = Math.max(0, remaining / splitCount);
  const isFullyPaid = remaining <= 0;

  const handleOpenPaymentSheet = (method: 'pix' | 'dinheiro' | 'cartao') => {
    setSelectedPaymentMethod(method);
    setPaymentSheetOpen(true);
  };

  const handleAddPayment = (amount: number, includeServiceFee: boolean, serviceFeeType: 'proportional' | 'integral') => {
    const proportionalFee = (amount * serviceFeePercentage) / 100;
    const fee = includeServiceFee ? (serviceFeeType === 'proportional' ? proportionalFee : serviceFee) : 0;
    
    const newPayment: Payment = {
      id: Date.now().toString(),
      method: selectedPaymentMethod,
      amount,
      serviceFee: fee,
      status: selectedPaymentMethod === 'pix' ? 'pending' : 'completed',
    };
    setPayments([...payments, newPayment]);
    onConfirmPayment(selectedPaymentMethod, amount + fee);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
    setActionsSheetOpen(false);
    setSelectedPayment(null);
  };

  const handleClearAllPayments = () => {
    setPayments([]);
    setRemoveAllSheetOpen(false);
  };

  const handleOpenActionsSheet = (payment: Payment) => {
    setSelectedPayment(payment);
    setActionsSheetOpen(true);
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'pix': return 'Online - Pix';
      case 'dinheiro': return 'Dinheiro';
      case 'cartao': return 'Cartão';
      default: return method;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">Fechar conta</h1>
        </div>
        <button 
          onClick={onGoToMap}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm">Mapa de mesas</span>
        </button>
      </header>

      {/* Print Button */}
      <div className="p-4">
        <button
          onClick={onPrint}
          className="w-full py-3 border-2 border-[#1e4976] rounded-xl text-white flex items-center justify-center gap-2 hover:border-cyan-500 transition-colors"
        >
          <Printer className="w-5 h-5" />
          Imprimir
        </button>
      </div>

      {/* Bill Summary */}
      <div className="px-4 pb-4">
        <h2 className="text-white font-bold text-lg mb-2">{tableName}</h2>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400 text-sm">
            <div className="flex items-center gap-1">
              <span>Taxa de serviço ({serviceFeePercentage}%)</span>
              {totalServiceFeePaid > 0 && totalServiceFeePaid < serviceFee && (
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalServiceFeePaid > 0 && totalServiceFeePaid < serviceFee && (
                <span className="line-through text-slate-500">{formatCurrency(serviceFee)}</span>
              )}
              <span>{formatCurrency(Math.max(0, serviceFee - totalServiceFeePaid))}</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-white font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Payments Section */}
      <div className="flex-1 pb-48">
        {payments.length > 0 && (
          <div className="bg-[#0d2847] px-4 py-3 flex items-center justify-between border-y border-[#1e4976]">
            <span className="text-white font-bold">Pagamentos</span>
            <button onClick={() => setRemoveAllSheetOpen(true)} className="p-2 text-slate-400 hover:text-white">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}

        {payments.map((payment) => (
          <div key={payment.id} className="px-4 py-3 flex items-center justify-between border-b border-[#1e4976]/30">
            <div className="flex items-center gap-3">
              <span className="text-white">{getMethodLabel(payment.method)}</span>
              {payment.status === 'expired' && (
                <span className="flex items-center gap-1 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Chave expirada
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{formatCurrency(payment.amount + payment.serviceFee)}</span>
              <button 
                onClick={() => handleOpenActionsSheet(payment)}
                className="p-1 text-cyan-400 hover:text-cyan-300"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom fixed area - changes based on payment status */}
      {isFullyPaid ? (
        <div className="fixed bottom-0 left-0 right-0">
          {/* Fully Paid Message */}
          <div className="bg-green-500 px-4 py-3 flex items-center justify-center">
            <span className="text-white font-bold">O valor total foi pago</span>
          </div>

          {/* Close Table Button */}
          <div className="bg-[#0d2847] p-3">
            <button
              onClick={() => setCloseConfirmOpen(true)}
              className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
            >
              Fechar mesa
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Remaining Amount */}
          <div className="fixed bottom-40 left-0 right-0 bg-red-500 px-4 py-3 flex items-center justify-between">
            <span className="text-white font-bold">Falta receber</span>
            <span className="text-white font-bold">{formatCurrency(remaining)}</span>
          </div>

          {/* Split Control */}
          <div className="fixed bottom-20 left-0 right-0 bg-[#0d2847] px-4 py-3 flex items-center justify-between border-y border-[#1e4976]">
            <span className="text-white">Dividir por:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSplitCount(Math.max(1, splitCount - 1))}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-white font-bold text-lg min-w-[24px] text-center">{splitCount}</span>
                <button 
                  onClick={() => setSplitCount(splitCount + 1)}
                  className="p-1 bg-green-500 rounded-full text-white hover:bg-green-400"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <span className="text-white font-bold">{formatCurrency(amountPerPerson)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#0d2847] p-3 flex gap-2">
            <button
              onClick={() => handleOpenPaymentSheet('pix')}
              className="flex-1 py-3 bg-green-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-green-400 transition-colors"
            >
              <Diamond className="w-5 h-5" />
              <span className="text-sm">Pix</span>
            </button>
            <button
              onClick={() => handleOpenPaymentSheet('dinheiro')}
              className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-cyan-400 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Dinheiro</span>
            </button>
            <button
              onClick={() => handleOpenPaymentSheet('cartao')}
              className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-cyan-400 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-sm">Cartão</span>
            </button>
          </div>
        </>
      )}

      {/* Payment Sheet */}
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        method={selectedPaymentMethod}
        defaultAmount={amountPerPerson}
        serviceFeePercentage={serviceFeePercentage}
        totalServiceFee={serviceFee}
        restaurantId={restaurantId}
        onConfirm={handleAddPayment}
      />

      {/* Close Table Confirmation */}
      <CloseTableConfirmDialog
        open={closeConfirmOpen}
        onOpenChange={setCloseConfirmOpen}
        onConfirm={onCloseTable}
      />

      {/* Remove All Payments Sheet */}
      <Sheet open={removeAllSheetOpen} onOpenChange={setRemoveAllSheetOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
          <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <SheetTitle className="text-black font-semibold">Remover pagamentos</SheetTitle>
            <button onClick={() => setRemoveAllSheetOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            <p className="text-gray-700">Tem certeza que deseja remover todos os pagamentos lançados?</p>
            <p className="text-gray-500 text-sm">Os pagamentos via Pix serão estornados.</p>
            <button
              onClick={handleClearAllPayments}
              className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
            >
              Sim, remover
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Actions Sheet */}
      <Sheet open={actionsSheetOpen} onOpenChange={setActionsSheetOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
          <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <SheetTitle className="text-black font-semibold">Ações do pagamento</SheetTitle>
            <button onClick={() => setActionsSheetOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-3">
            {selectedPayment && (
              <>
                {/* Payment Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-black font-medium">
                    {getMethodLabel(selectedPayment.method)}: {formatCurrency(selectedPayment.amount + selectedPayment.serviceFee)}
                  </span>
                </div>

                {/* Actions */}
                <button className="w-full py-3 flex items-center gap-3 text-cyan-500 hover:bg-gray-50 rounded-lg transition-colors">
                  <Pencil className="w-5 h-5" />
                  <span className="font-medium">Editar pagamento</span>
                </button>
                <button className="w-full py-3 flex items-center gap-3 text-cyan-500 hover:bg-gray-50 rounded-lg transition-colors">
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-medium">Trocar cliente</span>
                </button>
                <button 
                  onClick={() => handleRemovePayment(selectedPayment.id)}
                  className="w-full py-3 flex items-center gap-3 text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Remover pagamento</span>
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

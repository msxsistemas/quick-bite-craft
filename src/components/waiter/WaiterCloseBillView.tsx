import { useState } from 'react';
import { ArrowLeft, Home, Printer, Trash2, MoreVertical, Diamond, DollarSign, CreditCard, Minus, Plus, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Order } from '@/hooks/useOrders';

interface Payment {
  id: string;
  method: string;
  amount: number;
  status: 'pending' | 'completed' | 'expired';
}

interface WaiterCloseBillViewProps {
  tableName: string;
  orders: Order[];
  onBack: () => void;
  onGoToMap: () => void;
  onPrint: () => void;
  onConfirmPayment: (method: string, amount: number) => void;
  serviceFeePercentage?: number;
}

export const WaiterCloseBillView = ({
  tableName,
  orders,
  onBack,
  onGoToMap,
  onPrint,
  onConfirmPayment,
  serviceFeePercentage = 10,
}: WaiterCloseBillViewProps) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [splitCount, setSplitCount] = useState(1);

  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const serviceFee = (subtotal * serviceFeePercentage) / 100;
  const total = subtotal + serviceFee;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const amountPerPerson = remaining / splitCount;

  const handleAddPayment = (method: string) => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      method,
      amount: amountPerPerson,
      status: method === 'pix' ? 'pending' : 'completed',
    };
    setPayments([...payments, newPayment]);
    onConfirmPayment(method, amountPerPerson);
  };

  const handleRemovePayment = (id: string) => {
    setPayments(payments.filter(p => p.id !== id));
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
            <span>Taxa de serviço ({serviceFeePercentage}%)</span>
            <span>{formatCurrency(serviceFee)}</span>
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
            <button className="p-2 text-slate-400 hover:text-white">
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
              <span className="text-white font-medium">{formatCurrency(payment.amount)}</span>
              <button className="p-1 text-slate-400 hover:text-white">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

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
          onClick={() => handleAddPayment('pix')}
          className="flex-1 py-3 bg-green-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-green-400 transition-colors"
        >
          <Diamond className="w-5 h-5" />
          <span className="text-sm">Pix</span>
        </button>
        <button
          onClick={() => handleAddPayment('dinheiro')}
          className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-cyan-400 transition-colors"
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-sm">Dinheiro</span>
        </button>
        <button
          onClick={() => handleAddPayment('cartao')}
          className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-bold flex flex-col items-center gap-0.5 hover:bg-cyan-400 transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-sm">Cartão</span>
        </button>
      </div>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { ArrowLeft, Home, Printer, Trash2, MoreVertical, Diamond, DollarSign, CreditCard, Minus, Plus, AlertCircle, HelpCircle, X, Pencil, RefreshCw, User, Camera } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { Order } from '@/hooks/useOrders';
import { PaymentSheet } from './PaymentSheet';
import { CloseTableConfirmDialog } from './CloseTableConfirmDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EditPaymentSheet, PaymentData, CustomerInfo } from './EditPaymentSheet';
import { SwapCustomerSheet } from './SwapCustomerSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface Payment {
  id: string;
  method: 'pix' | 'dinheiro' | 'cartao';
  amount: number;
  serviceFee: number;
  status: 'pending' | 'completed' | 'expired';
  customers?: CustomerInfo[];
}

interface WaiterCloseBillViewProps {
  tableName: string;
  orders: Order[];
  restaurantId: string;
  tableId?: string;
  comandaId?: string;
  waiterId?: string;
  onBack: () => void;
  onGoToMap: () => void;
  onPrint: () => void;
  onConfirmPayment: (method: string, amount: number) => void;
  onCloseTable: () => void;
  serviceFeePercentage?: number;
  isComanda?: boolean;
}

export const WaiterCloseBillView = ({
  tableName,
  orders,
  restaurantId,
  tableId,
  comandaId,
  waiterId,
  onBack,
  onGoToMap,
  onPrint,
  onConfirmPayment,
  onCloseTable,
  serviceFeePercentage = 10,
  isComanda = false,
}: WaiterCloseBillViewProps) => {
  const entityLabel = isComanda ? 'comanda' : 'mesa';
  const [payments, setPayments] = useState<Payment[]>([]);
  const [splitCount, setSplitCount] = useState(1);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'dinheiro' | 'cartao'>('cartao');
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [removeAllSheetOpen, setRemoveAllSheetOpen] = useState(false);
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editPaymentSheetOpen, setEditPaymentSheetOpen] = useState(false);
  const [swapCustomerSheetOpen, setSwapCustomerSheetOpen] = useState(false);
  const [removePaymentSheetOpen, setRemovePaymentSheetOpen] = useState(false);

  // Load payments from database
  useEffect(() => {
    const loadPayments = async () => {
      let query = supabase
        .from('table_payments')
        .select('*')
        .eq('restaurant_id', restaurantId);
      
      if (tableId) {
        query = query.eq('table_id', tableId);
      } else if (comandaId) {
        query = query.eq('comanda_id', comandaId);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading payments:', error);
        return;
      }

      if (data) {
        setPayments(data.map(p => ({
          id: p.id,
          method: p.method as 'pix' | 'dinheiro' | 'cartao',
          amount: Number(p.amount),
          serviceFee: Number(p.service_fee),
          status: p.status as 'pending' | 'completed' | 'expired',
          customers: (p.customers as unknown as CustomerInfo[]) || [],
        })));
      }
    };

    loadPayments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('table_payments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_payments',
          filter: tableId 
            ? `table_id=eq.${tableId}` 
            : comandaId 
              ? `comanda_id=eq.${comandaId}` 
              : undefined,
        },
        () => {
          loadPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableId, comandaId]);

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

  const handleAddPayment = async (amount: number, includeServiceFee: boolean, serviceFeeType: 'proportional' | 'integral', customers?: CustomerInfo[]) => {
    const proportionalFee = (amount * serviceFeePercentage) / 100;
    const fee = includeServiceFee ? (serviceFeeType === 'proportional' ? proportionalFee : serviceFee) : 0;
    
    const { data, error } = await supabase
      .from('table_payments')
      .insert([{
        restaurant_id: restaurantId,
        table_id: tableId || null,
        comanda_id: comandaId || null,
        method: selectedPaymentMethod,
        amount,
        service_fee: fee,
        status: selectedPaymentMethod === 'pix' ? 'pending' : 'completed',
        customers: JSON.parse(JSON.stringify(customers || [])) as Json,
        waiter_id: waiterId || null,
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro ao salvar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    if (data) {
      const newPayment: Payment = {
        id: data.id,
        method: data.method as 'pix' | 'dinheiro' | 'cartao',
        amount: Number(data.amount),
        serviceFee: Number(data.service_fee),
        status: data.status as 'pending' | 'completed' | 'expired',
        customers: (data.customers as unknown as CustomerInfo[]) || [],
      };
      setPayments([...payments, newPayment]);
      onConfirmPayment(selectedPaymentMethod, amount + fee);
    }
  };

  const handleEditPayment = async (updatedPayment: PaymentData) => {
    const { error } = await supabase
      .from('table_payments')
      .update({
        method: updatedPayment.method,
        amount: updatedPayment.amount,
        service_fee: updatedPayment.serviceFee,
        status: updatedPayment.status,
        customers: JSON.parse(JSON.stringify(updatedPayment.customers || [])) as Json,
      })
      .eq('id', updatedPayment.id);

    if (error) {
      toast({
        title: 'Erro ao atualizar pagamento',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPayments(payments.map(p => 
      p.id === updatedPayment.id 
        ? { ...updatedPayment } as Payment
        : p
    ));
    setActionsSheetOpen(false);
    setSelectedPayment(null);
  };

  const handleSwapCustomer = async (customers: CustomerInfo[]) => {
    if (selectedPayment) {
      const { error } = await supabase
        .from('table_payments')
        .update({ customers: JSON.parse(JSON.stringify(customers)) as Json })
        .eq('id', selectedPayment.id);

      if (error) {
        toast({
          title: 'Erro ao atualizar cliente',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setPayments(payments.map(p => 
        p.id === selectedPayment.id 
          ? { ...p, customers }
          : p
      ));
    }
    setActionsSheetOpen(false);
    setSelectedPayment(null);
  };

  const handleOpenEditSheet = () => {
    setActionsSheetOpen(false);
    setEditPaymentSheetOpen(true);
  };

  const handleOpenRemovePaymentSheet = () => {
    setActionsSheetOpen(false);
    setRemovePaymentSheetOpen(true);
  };

  const handleOpenSwapCustomerSheet = () => {
    setActionsSheetOpen(false);
    setSwapCustomerSheetOpen(true);
  };

  const handleRemovePayment = async (id: string) => {
    const { error } = await supabase
      .from('table_payments')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao remover pagamento',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setPayments(payments.filter(p => p.id !== id));
    setActionsSheetOpen(false);
    setSelectedPayment(null);
  };

  const handleClearAllPayments = async () => {
    const paymentIds = payments.map(p => p.id);
    
    if (paymentIds.length > 0) {
      const { error } = await supabase
        .from('table_payments')
        .delete()
        .in('id', paymentIds);

      if (error) {
        toast({
          title: 'Erro ao remover pagamentos',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
    }

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
          <span className="text-sm">{isComanda ? 'Mapa de comandas' : 'Mapa de mesas'}</span>
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

        {payments.map((payment) => {
          const customerNames = payment.customers?.filter(c => c.identified && c.name).map(c => c.name) || [];
          const hasUnidentified = payment.customers?.some(c => !c.identified) || false;
          const displayNames = customerNames.length > 0 
            ? customerNames.join(', ') + (hasUnidentified ? ' +' : '')
            : hasUnidentified 
              ? 'Não identificado' 
              : null;

          return (
            <div key={payment.id} className="px-4 py-3 border-b border-[#1e4976]/30">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white">{getMethodLabel(payment.method)}</span>
                  {displayNames && (
                    <span className="text-slate-400 text-sm">{displayNames}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === 'expired' && (
                    <span className="flex items-center gap-1 text-red-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Expirado
                    </span>
                  )}
                  <span className="text-white font-medium">{formatCurrency(payment.amount + payment.serviceFee)}</span>
                  <button 
                    onClick={() => handleOpenActionsSheet(payment)}
                    className="p-1 text-cyan-400 hover:text-cyan-300"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
              Fechar {entityLabel}
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
        isComanda={isComanda}
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
          <SheetHeader className="p-4 pb-0 flex flex-row items-center justify-between">
            <SheetTitle className="text-black font-semibold text-base">Ações do pagamento</SheetTitle>
            <button onClick={() => setActionsSheetOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </SheetHeader>
          <div className="px-4 pb-4">
            {selectedPayment && (
              <>
                {/* Payment Info */}
                <div className="flex items-center gap-3 py-3 border-b border-gray-200">
                  <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-black font-medium text-sm">
                    {getMethodLabel(selectedPayment.method)}: {formatCurrency(selectedPayment.amount + selectedPayment.serviceFee)}
                  </span>
                </div>

                {/* Actions */}
                <button 
                  onClick={handleOpenEditSheet}
                  className="w-full py-3 flex items-center gap-3 text-cyan-500 border-b border-gray-200"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="font-medium text-sm">Editar pagamento</span>
                </button>
                <button 
                  onClick={handleOpenSwapCustomerSheet}
                  className="w-full py-3 flex items-center gap-3 text-cyan-500 border-b border-gray-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="font-medium text-sm">Trocar cliente</span>
                </button>
                <button 
                  onClick={handleOpenRemovePaymentSheet}
                  className="w-full py-3 flex items-center gap-3 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium text-sm">Remover pagamento</span>
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Payment Sheet */}
      <EditPaymentSheet
        open={editPaymentSheetOpen}
        onOpenChange={setEditPaymentSheetOpen}
        payment={selectedPayment as PaymentData | null}
        serviceFeePercentage={serviceFeePercentage}
        totalServiceFee={serviceFee}
        onSave={handleEditPayment}
      />

      {/* Swap Customer Sheet */}
      <SwapCustomerSheet
        open={swapCustomerSheetOpen}
        onOpenChange={setSwapCustomerSheetOpen}
        currentCustomers={selectedPayment?.customers || []}
        restaurantId={restaurantId}
        onSave={handleSwapCustomer}
      />

      {/* Remove Single Payment Confirmation Sheet */}
      <Sheet open={removePaymentSheetOpen} onOpenChange={setRemovePaymentSheetOpen}>
        <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
          <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <SheetTitle className="text-black font-semibold">Remover pagamento</SheetTitle>
            <button onClick={() => setRemovePaymentSheetOpen(false)} className="p-1 text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </SheetHeader>
          <div className="px-4 pb-6 space-y-4">
            {selectedPayment && (
              <>
                {/* Payment Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-100 rounded-lg">
                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-black font-medium">
                    {getMethodLabel(selectedPayment.method)}: {formatCurrency(selectedPayment.amount + selectedPayment.serviceFee)}
                  </span>
                </div>

                {/* Buttons */}
                <button
                  onClick={() => {
                    handleRemovePayment(selectedPayment.id);
                    setRemovePaymentSheetOpen(false);
                  }}
                  className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
                >
                  Remover
                </button>
                <button
                  onClick={() => setRemovePaymentSheetOpen(false)}
                  className="w-full py-4 border-2 border-cyan-500 rounded-xl text-cyan-500 font-bold hover:bg-cyan-50 transition-colors"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

import { useState } from 'react';
import { ArrowLeft, Clock, CreditCard, Banknote } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/format';

interface DeliveryAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  reference?: string;
  complement?: string;
}

interface DeliveryOptionsViewProps {
  customerName: string;
  customerPhone: string;
  subtotal: number;
  deliveryFee: number;
  onBack: () => void;
  onEditCustomer: () => void;
  onNewAddress: () => void;
  onConfirmOrder: (method: string, changeAmount?: number) => void;
  savedAddress?: DeliveryAddress | null;
}

export const DeliveryOptionsView = ({
  customerName,
  customerPhone,
  subtotal,
  deliveryFee,
  onBack,
  onEditCustomer,
  onNewAddress,
  onConfirmOrder,
  savedAddress,
}: DeliveryOptionsViewProps) => {
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeAmount, setChangeAmount] = useState('');

  const total = subtotal + (deliveryType === 'delivery' ? deliveryFee : 0);

  const canSelectPayment = deliveryType !== null && (deliveryType === 'pickup' || (deliveryType === 'delivery' && savedAddress));

  const handleSelectPayment = (method: string) => {
    if (method === 'dinheiro') {
      setPaymentMethod(method);
      setShowChangeModal(true);
    } else {
      setPaymentMethod(method);
    }
  };

  const handleConfirmChange = (needsChange: boolean) => {
    setShowChangeModal(false);
    if (needsChange && changeAmount) {
      onConfirmOrder('dinheiro', parseFloat(changeAmount.replace(/\D/g, '')) / 100);
    } else {
      onConfirmOrder('dinheiro');
    }
  };

  const handleSubmit = () => {
    if (paymentMethod && paymentMethod !== 'dinheiro') {
      onConfirmOrder(paymentMethod);
    }
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseInt(numbers || '0') / 100;
    return formatCurrency(amount);
  };

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold">Pedido delivery</h1>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Customer Info */}
        <div className="p-4 bg-[#0d2847]">
          <p className="text-sm text-slate-400 mb-1">Cliente delivery</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold">{customerName}</p>
              <p className="text-slate-400 text-sm">{customerPhone}</p>
            </div>
            <button 
              onClick={onEditCustomer}
              className="px-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/10 transition-colors"
            >
              Editar
            </button>
          </div>
        </div>

        {/* Delivery Type */}
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium">
            Escolha a forma de entrega
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0">
            <button
              onClick={() => setDeliveryType('pickup')}
              className="w-full p-4 flex items-center justify-between border-b border-[#1e4976]"
            >
              <span className="text-white">Retirar no local</span>
              <div className={`w-5 h-5 rounded-full border-2 ${deliveryType === 'pickup' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'}`}>
                {deliveryType === 'pickup' && <div className="w-full h-full rounded-full bg-white scale-50" />}
              </div>
            </button>

            <div className="p-4">
              <p className="text-white mb-3">Entrega</p>
              
              {savedAddress ? (
                <div className="bg-[#1e3a5f] rounded-xl p-4 border border-[#1e4976]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Entre 0 - 0 min</span>
                      </div>
                      <p className="text-white">{savedAddress.street}, {savedAddress.number}</p>
                      <p className="text-slate-400 text-sm">{savedAddress.neighborhood}, {savedAddress.city}</p>
                    </div>
                    <button 
                      onClick={onNewAddress}
                      className="px-4 py-2 border border-cyan-500 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/10 transition-colors"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setDeliveryType('delivery');
                    onNewAddress();
                  }}
                  className="w-full py-3 bg-cyan-500 text-white rounded-full font-medium hover:bg-cyan-600 transition-colors"
                >
                  Novo endereço
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium">
            Escolha a forma de pagamento
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0">
            {!canSelectPayment ? (
              <p className="text-center text-slate-400 py-6">
                Selecione a entrega para continuar
              </p>
            ) : (
              <>
                <p className="text-slate-400 text-sm p-4 pb-2">Pagamento na entrega</p>
                
                <button
                  onClick={() => handleSelectPayment('pix')}
                  className="w-full p-4 flex items-center justify-between border-b border-[#1e4976]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-teal-500 rounded flex items-center justify-center text-white text-xs font-bold">
                      PIX
                    </div>
                    <span className="text-white">Pix</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'pix' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'}`}>
                    {paymentMethod === 'pix' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                </button>

                <button
                  onClick={() => handleSelectPayment('dinheiro')}
                  className="w-full p-4 flex items-center justify-between border-b border-[#1e4976]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-green-500 rounded flex items-center justify-center">
                      <Banknote className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white">Dinheiro</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'dinheiro' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'}`}>
                    {paymentMethod === 'dinheiro' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                </button>

                <button
                  onClick={() => handleSelectPayment('cartao')}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-5 bg-blue-500 rounded flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-white">Cartão</span>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'cartao' ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'}`}>
                    {paymentMethod === 'cartao' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="p-4">
          <p className="text-white font-medium mb-2">Observação do pedido</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: Apertar campainha, não buzinar, etc."
            className="w-full h-24 p-3 bg-white text-gray-900 rounded-xl resize-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d2847] border-t border-[#1e4976] p-4">
        <div className="space-y-1 mb-4 text-right">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Taxa de serviço</span>
            <span>{formatCurrency(0)}</span>
          </div>
          {deliveryType === 'delivery' && (
            <div className="flex justify-between text-slate-400">
              <span>Taxa de entrega</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-white font-bold">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!paymentMethod || paymentMethod === 'dinheiro'}
          className="w-full py-4 bg-slate-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-500 transition-colors"
        >
          {!canSelectPayment 
            ? 'Selecione a forma de entrega' 
            : !paymentMethod 
              ? 'Selecione a forma de pagamento'
              : 'Confirmar pedido'}
        </button>
      </div>

      {/* Change Modal */}
      {showChangeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowChangeModal(false);
          }}
        >
          <div className="w-[99%] max-w-none bg-white rounded-2xl animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Precisa de troco?</h2>
                <button 
                  onClick={() => setShowChangeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                O pedido fechou em <strong>{formatCurrency(total)}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Troco para <span className="text-gray-400">(opcional)</span>
                </label>
                <Input
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(formatCurrencyInput(e.target.value))}
                  placeholder="R$ 50,00"
                  className="h-12 bg-white border border-cyan-500 text-gray-900"
                />
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleConfirmChange(false)}
                  className="w-full py-4 border-2 border-cyan-500 text-cyan-500 rounded-xl font-medium hover:bg-cyan-50 transition-colors"
                >
                  Não preciso de troco
                </button>
                <button
                  onClick={() => handleConfirmChange(true)}
                  className="w-full py-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                >
                  Sim, preciso de troco
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

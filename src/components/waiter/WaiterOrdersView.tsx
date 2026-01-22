import { useState } from 'react';
import { ArrowLeft, Printer, Plus, DollarSign, Users, MoreVertical, Pencil, Trash2, Minus } from 'lucide-react';
import { Order, OrderItem } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/format';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface WaiterOrdersViewProps {
  tableName: string;
  orders: Order[];
  onBack: () => void;
  onPrint: () => void;
  onNewOrder: () => void;
  onCloseBill: () => void;
  onMarkDelivered: (orderId: string, delivered: boolean) => void;
  onEditItem?: (orderId: string, itemIndex: number, item: OrderItem, newQuantity: number, newNotes: string) => void;
  onCancelItem?: (orderId: string, itemIndex: number, item: OrderItem) => void;
  serviceFeePercentage?: number;
}

interface SelectedItem {
  orderId: string;
  itemIndex: number;
  item: OrderItem;
}

type SheetMode = 'actions' | 'edit';

export const WaiterOrdersView = ({
  tableName,
  orders,
  onBack,
  onPrint,
  onNewOrder,
  onCloseBill,
  onMarkDelivered,
  onEditItem,
  onCancelItem,
  serviceFeePercentage = 10,
}: WaiterOrdersViewProps) => {
  const [deliveredOrders, setDeliveredOrders] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('actions');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Edit state
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNotes, setEditNotes] = useState('');

  const handleToggleDelivered = (orderId: string) => {
    const newSet = new Set(deliveredOrders);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
      onMarkDelivered(orderId, false);
    } else {
      newSet.add(orderId);
      onMarkDelivered(orderId, true);
    }
    setDeliveredOrders(newSet);
  };

  const handleOpenItemActions = (orderId: string, itemIndex: number, item: OrderItem) => {
    setSelectedItem({ orderId, itemIndex, item });
    setSheetMode('actions');
  };

  const handleCloseSheet = () => {
    setSelectedItem(null);
    setSheetMode('actions');
    setEditQuantity(1);
    setEditNotes('');
  };

  const handleOpenEditMode = () => {
    if (selectedItem) {
      setEditQuantity(selectedItem.item.quantity);
      setEditNotes(selectedItem.item.notes || '');
      setSheetMode('edit');
    }
  };

  const handleSaveEdit = () => {
    if (selectedItem && onEditItem) {
      onEditItem(selectedItem.orderId, selectedItem.itemIndex, selectedItem.item, editQuantity, editNotes);
    }
    handleCloseSheet();
  };

  const handleOpenCancelConfirm = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    if (selectedItem && onCancelItem) {
      onCancelItem(selectedItem.orderId, selectedItem.itemIndex, selectedItem.item);
    }
    setShowCancelConfirm(false);
    handleCloseSheet();
  };

  const subtotal = orders.reduce((sum, order) => sum + order.subtotal, 0);
  const serviceFee = (subtotal * serviceFeePercentage) / 100;
  const total = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-white font-semibold">{tableName}</h1>
        </div>
        <button className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors">
          <Users className="w-6 h-6" />
        </button>
      </header>

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto pb-48">
        {orders.map((order, orderIndex) => {
          const orderItems = Array.isArray(order.items) ? order.items as OrderItem[] : [];
          const orderSubtotal = orderItems.reduce((sum, item) => {
            const extrasTotal = item.extras?.reduce((eSum, e) => eSum + e.price, 0) || 0;
            return sum + ((item.productPrice + extrasTotal) * item.quantity);
          }, 0);

          return (
            <div key={order.id} className="border-b border-[#1e4976]">
              {/* Order Header */}
              <div className="bg-[#0d2847] px-4 py-3 flex items-center justify-between">
                <span className="text-white font-bold">Pedido #{order.order_number}</span>
                <button className="p-2 text-slate-400 hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Order Items */}
              <div className="px-4 py-3 space-y-2">
                {orderItems.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white">{item.quantity}x {item.productName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white">{formatCurrency(item.productPrice * item.quantity)}</span>
                          <button 
                            onClick={() => handleOpenItemActions(order.id, itemIndex, item)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {item.notes && (
                        <div className="ml-4 text-sm text-amber-400 mt-1">
                          Obs: {item.notes}
                        </div>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <div className="ml-4 text-sm text-slate-400">
                          <span>{item.extras[0]?.groupTitle || 'Extras'}</span>
                          {item.extras.map((extra, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="ml-2">{extra.optionName}</span>
                              <span>{formatCurrency(extra.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Subtotal */}
              <div className="px-4 py-2 flex items-center justify-between border-t border-[#1e4976]/50">
                <span className="text-white font-bold">Subtotal</span>
                <span className="text-white font-bold">{formatCurrency(orderSubtotal)}</span>
              </div>

              {/* Mark as Delivered */}
              <div className="px-4 py-3 flex items-center justify-end gap-2">
                <Checkbox
                  id={`delivered-${order.id}`}
                  checked={deliveredOrders.has(order.id)}
                  onCheckedChange={() => handleToggleDelivered(order.id)}
                  className="border-white data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                />
                <label 
                  htmlFor={`delivered-${order.id}`}
                  className="text-white text-sm cursor-pointer"
                >
                  Marcar como entregue
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Summary */}
      <div className="fixed bottom-16 left-0 right-0 bg-[#0d2847] border-t border-[#1e4976] px-4 py-3">
        <div className="flex items-center justify-between text-slate-400 text-sm">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 text-sm">
          <span>Taxa de serviço ({serviceFeePercentage}%)</span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
        <div className="flex items-center justify-between text-white font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d2847] border-t border-[#1e4976] px-4 py-3 flex items-center justify-around">
        <button onClick={onPrint} className="flex flex-col items-center gap-1 text-slate-400 hover:text-white">
          <Printer className="w-6 h-6" />
          <span className="text-xs">Imprimir</span>
        </button>
        
        <button 
          onClick={onNewOrder}
          className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center -mt-8 shadow-lg hover:bg-cyan-400 transition-colors"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-slate-400">Gerar pedido</span>
        
        <button onClick={onCloseBill} className="flex flex-col items-center gap-1 text-amber-500 hover:text-amber-400">
          <DollarSign className="w-6 h-6" />
          <span className="text-xs">Fechar conta</span>
        </button>
      </div>

      {/* Item Actions/Edit Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && handleCloseSheet()}>
        <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0">
          <SheetHeader className="px-4 py-4 border-b flex flex-row items-center justify-between">
            <SheetTitle className="text-gray-900 font-semibold">
              {sheetMode === 'actions' ? 'Ações do item' : 'Editar item'}
            </SheetTitle>
          </SheetHeader>
          
          {selectedItem && sheetMode === 'actions' && (
            <div className="p-4">
              {/* Item Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-lg" />
                <span className="text-gray-900 font-medium">{selectedItem.item.productName}</span>
              </div>

              {/* Actions */}
              <div className="space-y-1">
                <button 
                  onClick={handleOpenEditMode}
                  className="w-full flex items-center gap-3 px-3 py-3 text-cyan-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                  <span className="font-medium">Editar item</span>
                </button>
                
                <button 
                  onClick={handleOpenCancelConfirm}
                  className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  <span className="font-medium">Cancelar item</span>
                </button>
              </div>
            </div>
          )}

          {selectedItem && sheetMode === 'edit' && (
            <div className="p-4 space-y-4">
              {/* Item Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-300 rounded-lg" />
                <div>
                  <span className="text-gray-900 font-medium block">{selectedItem.item.productName}</span>
                  <span className="text-gray-500 text-sm">{formatCurrency(selectedItem.item.productPrice)}</span>
                </div>
              </div>

              {/* Quantity Controls */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium text-sm">Quantidade</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    disabled={editQuantity <= 1}
                  >
                    <Minus className="w-5 h-5 text-gray-600" />
                  </button>
                  <span className="text-xl font-bold text-gray-900 w-8 text-center">{editQuantity}</span>
                  <button
                    onClick={() => setEditQuantity(editQuantity + 1)}
                    className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center hover:bg-cyan-400 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-gray-700 font-medium text-sm">Observações</label>
                <Textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, bem passado..."
                  className="min-h-[80px] bg-white border-gray-300"
                />
              </div>

              {/* Save Button */}
              <Button 
                onClick={handleSaveEdit}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white py-6"
              >
                Salvar alterações - {formatCurrency(selectedItem.item.productPrice * editQuantity)}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar item?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar{' '}
              <span className="font-semibold text-gray-900">
                {selectedItem?.item.quantity}x {selectedItem?.item.productName}
              </span>
              ? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não, manter</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancel}
              className="bg-red-500 hover:bg-red-600"
            >
              Sim, cancelar item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

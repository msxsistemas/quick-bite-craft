import { forwardRef } from 'react';
import { Order, OrderItem } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/format';

interface OrderPrintViewProps {
  order: Order;
  restaurantName?: string;
}

export const OrderPrintView = forwardRef<HTMLDivElement, OrderPrintViewProps>(
  ({ order, restaurantName }, ref) => {
    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    };

    return (
      <div
        ref={ref}
        className="print-content"
        style={{
          width: '80mm',
          fontFamily: 'monospace',
          fontSize: '12px',
          padding: '8px',
          backgroundColor: 'white',
          color: 'black',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {restaurantName || 'PEDIDO'}
          </div>
          <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />
        </div>

        {/* Order Number */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            #{order.order_number}
          </div>
          <div style={{ fontSize: '10px' }}>
            {formatDate(order.created_at)} - {formatTime(order.created_at)}
          </div>
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

        {/* Customer Info */}
        <div style={{ marginBottom: '8px' }}>
          <div><strong>Cliente:</strong> {order.customer_name}</div>
          <div><strong>Tel:</strong> {order.customer_phone}</div>
          {order.customer_address && (
            <div style={{ marginTop: '4px' }}>
              <strong>Endereço:</strong>
              <div style={{ fontSize: '11px', marginLeft: '8px' }}>
                {order.customer_address}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

        {/* Items */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>ITENS:</div>
          {order.items.map((item, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
                  {item.quantity}x {item.productName}
                </span>
              </div>
              {item.extras && item.extras.length > 0 && (
                <div style={{ marginLeft: '16px', fontSize: '11px' }}>
                  {item.extras.map((extra, i) => (
                    <div key={i}>+ {extra.optionName}</div>
                  ))}
                </div>
              )}
              {item.notes && (
                <div style={{ 
                  marginLeft: '16px', 
                  fontSize: '11px',
                  fontStyle: 'italic',
                  backgroundColor: '#f0f0f0',
                  padding: '2px 4px',
                  marginTop: '2px'
                }}>
                  ⚠️ OBS: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {order.notes && (
          <>
            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '4px',
              fontSize: '11px'
            }}>
              <strong>OBSERVAÇÕES DO PEDIDO:</strong>
              <div>{order.notes}</div>
            </div>
          </>
        )}

        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

        {/* Payment Info */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Desconto:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.delivery_fee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Entrega:</span>
              <span>{formatCurrency(order.delivery_fee)}</span>
            </div>
          )}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold',
            fontSize: '14px',
            marginTop: '4px',
            borderTop: '1px solid #000',
            paddingTop: '4px'
          }}>
            <span>TOTAL:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

        {/* Payment Method */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontWeight: 'bold' }}>
            Pagamento: {order.payment_method.toUpperCase()}
          </div>
          {order.payment_change && (
            <div>Troco para: {formatCurrency(order.payment_change)}</div>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

        {/* Footer */}
        <div style={{ textAlign: 'center', fontSize: '10px' }}>
          <div>Obrigado pela preferência!</div>
          <div style={{ marginTop: '16px' }}>.</div>
        </div>
      </div>
    );
  }
);

OrderPrintView.displayName = 'OrderPrintView';

// Print styles to be added to index.css
export const printStyles = `
@media print {
  body * {
    visibility: hidden;
  }
  .print-content, .print-content * {
    visibility: visible;
  }
  .print-content {
    position: absolute;
    left: 0;
    top: 0;
  }
  @page {
    size: 80mm auto;
    margin: 0;
  }
}
`;

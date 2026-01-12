import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Ticket, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  usedCount: number;
  maxUses: number;
  expiresAt: string;
  active: boolean;
  visible: boolean;
}

const CouponsPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [coupons] = useState<Coupon[]>([
    { 
      id: 1, 
      code: 'BEMVINDO10', 
      discountType: 'percent', 
      discountValue: 10, 
      minOrderValue: 40, 
      usedCount: 0, 
      maxUses: 100, 
      expiresAt: '30/12/2026',
      active: true,
      visible: false
    },
    { 
      id: 2, 
      code: 'FRETE0', 
      discountType: 'fixed', 
      discountValue: 10, 
      minOrderValue: 50, 
      usedCount: 0, 
      maxUses: 50, 
      expiresAt: '29/06/2026',
      active: true,
      visible: false
    },
    { 
      id: 3, 
      code: 'COMBO15', 
      discountType: 'percent', 
      discountValue: 15, 
      minOrderValue: 60, 
      usedCount: 0, 
      maxUses: 0, 
      expiresAt: '30/03/2026',
      active: true,
      visible: false
    },
  ]);

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">{coupons.length} cupons cadastrados</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" />
            Novo Cupom
          </button>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-3 gap-4">
          {coupons.map((coupon) => (
            <div key={coupon.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Coupon Icon */}
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-5 h-5 text-amber-600" />
                  </div>
                  
                  {/* Coupon Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-foreground">{coupon.code}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        coupon.active
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {coupon.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-amber-600 font-bold text-lg">
                      {coupon.discountType === 'percent' 
                        ? `${coupon.discountValue}%` 
                        : `R$ ${coupon.discountValue.toFixed(2).replace('.', ',')}`
                      }
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <p>Mínimo: R$ {coupon.minOrderValue.toFixed(2).replace('.', ',')}</p>
                  {coupon.maxUses > 0 && (
                    <p>Usos: {coupon.usedCount}/{coupon.maxUses}</p>
                  )}
                  <p>Expira: {coupon.expiresAt}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center border-t border-border">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors">
                  {coupon.visible ? (
                    <>
                      <Eye className="w-4 h-4" />
                      On
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" />
                      Off
                    </>
                  )}
                </button>
                <div className="w-px h-8 bg-border" />
                <button className="p-3 text-muted-foreground hover:bg-muted transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="w-px h-8 bg-border" />
                <button className="p-3 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default CouponsPage;

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Ticket, Eye, EyeOff, Pencil, Trash2, Loader2, RefreshCw, Clock } from 'lucide-react';
import { useCoupons, Coupon, CouponFormData } from '@/hooks/useCoupons';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CouponsPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug);
  const { 
    coupons, 
    isLoading, 
    createCoupon, 
    updateCoupon, 
    deleteCoupon, 
    toggleCouponActive 
  } = useCoupons(restaurant?.id);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toggleCoupon, setToggleCoupon] = useState<Coupon | null>(null);
  const [showMinOrderField, setShowMinOrderField] = useState(false);
  const [showValidityFields, setShowValidityFields] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discount_type: 'percent',
    discount_value: 0,
    min_order_value: 0,
    max_uses: null,
    max_uses_per_customer: null,
    expires_at: null,
    active: true,
    visible: true,
  });

  // Separate fields for fixed/percent discount
  const [fixedDiscount, setFixedDiscount] = useState<number>(0);
  const [percentDiscount, setPercentDiscount] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [limitPerCustomer, setLimitPerCustomer] = useState<string>('');

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: 0,
      min_order_value: 0,
      max_uses: null,
      max_uses_per_customer: null,
      expires_at: null,
      active: true,
      visible: true,
    });
    setFixedDiscount(0);
    setPercentDiscount('');
    setStartDate('');
    setEndDate('');
    setLimitPerCustomer('');
    setShowMinOrderField(false);
    setShowValidityFields(false);
    setEditingCoupon(null);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_value: coupon.min_order_value,
        max_uses: coupon.max_uses,
        max_uses_per_customer: coupon.max_uses_per_customer,
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : null,
        active: coupon.active,
        visible: coupon.visible,
      });
      if (coupon.discount_type === 'fixed') {
        setFixedDiscount(coupon.discount_value);
        setPercentDiscount('');
      } else {
        setPercentDiscount(coupon.discount_value.toString());
        setFixedDiscount(0);
      }
      setLimitPerCustomer(coupon.max_uses_per_customer?.toString() ?? '');
      setShowMinOrderField(coupon.min_order_value > 0);
      if (coupon.expires_at) {
        setEndDate(coupon.expires_at.split('T')[0]);
        setShowValidityFields(true);
      }
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine discount value based on which field has value
    let discountValue = 0;
    let discountType: 'percent' | 'fixed' = 'percent';
    
    if (fixedDiscount > 0) {
      discountValue = fixedDiscount;
      discountType = 'fixed';
    } else if (percentDiscount) {
      discountValue = parseFloat(percentDiscount) || 0;
      discountType = 'percent';
    }

    const dataToSubmit = {
      ...formData,
      discount_type: discountType,
      discount_value: discountValue,
      max_uses_per_customer: limitPerCustomer ? parseInt(limitPerCustomer) : null,
      expires_at: endDate ? new Date(endDate).toISOString() : null,
    };

    if (editingCoupon) {
      await updateCoupon.mutateAsync({ id: editingCoupon.id, ...dataToSubmit });
    } else {
      await createCoupon.mutateAsync(dataToSubmit);
    }
    
    handleCloseModal();
  };

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deleteCoupon.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleToggleClick = (coupon: Coupon) => {
    setToggleCoupon(coupon);
  };

  const handleConfirmToggle = async () => {
    if (toggleCoupon) {
      await toggleCouponActive.mutateAsync({ id: toggleCoupon.id, active: !toggleCoupon.active });
      setToggleCoupon(null);
    }
  };

  const formatExpirationDate = (dateStr: string | null) => {
    if (!dateStr) return 'Sem expiração';
    try {
      return format(parseISO(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  if (restaurantLoading || isLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">{coupons.length} cupons cadastrados</p>
          </div>
          <Button onClick={() => handleOpenModal()} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Cupom
          </Button>
        </div>

        {/* Coupons Grid */}
        {coupons.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum cupom cadastrado</p>
            <p className="text-sm">Clique em "Novo Cupom" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        {coupon.discount_type === 'percent' 
                          ? `${coupon.discount_value}%` 
                          : `R$ ${coupon.discount_value.toFixed(2).replace('.', ',')}`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    <p>Mínimo: R$ {coupon.min_order_value.toFixed(2).replace('.', ',')}</p>
                    {coupon.max_uses && (
                      <p>Usos: {coupon.used_count}/{coupon.max_uses}</p>
                    )}
                    <p>Expira: {formatExpirationDate(coupon.expires_at)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center border-t border-border">
                  <button 
                    onClick={() => handleToggleClick(coupon)}
                    disabled={toggleCouponActive.isPending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                    title={coupon.active ? 'Desativar cupom' : 'Ativar cupom'}
                  >
                    {coupon.active ? (
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
                  <button 
                    onClick={() => handleOpenModal(coupon)}
                    className="p-3 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <div className="w-px h-8 bg-border" />
                  <button 
                    onClick={() => setDeleteConfirmId(coupon.id)}
                    className="p-3 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal - New Design */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Left side - Decorative image */}
            <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-pink-100 to-rose-200 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Main coupon illustration */}
                  <div className="w-48 h-32 bg-gradient-to-r from-rose-300 to-pink-300 rounded-lg transform -rotate-12 shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl">❤️</span>
                      <p className="text-rose-600 font-bold text-xl">desconto</p>
                    </div>
                  </div>
                  {/* Floating icons */}
                  <div className="absolute -top-8 -right-4 text-3xl animate-bounce">😊</div>
                  <div className="absolute -bottom-6 -left-8 text-3xl">💰</div>
                  <div className="absolute top-12 -left-12 text-2xl">%</div>
                  <div className="absolute -top-12 left-8 text-2xl">✓</div>
                </div>
              </div>
              {/* Background decorations */}
              <div className="absolute top-4 left-4 w-16 h-16 bg-rose-200/50 rounded-full" />
              <div className="absolute bottom-8 right-8 w-24 h-24 bg-pink-200/50 rounded-full" />
              <div className="absolute top-1/3 right-4 text-rose-300 text-6xl font-bold opacity-30">R$</div>
              <div className="absolute bottom-1/4 left-4 text-rose-300 text-4xl font-bold opacity-30">%</div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {editingCoupon ? 'Editar cupom de desconto' : 'Novo cupom de desconto'}
              </h2>

              <form id="coupon-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Code field with toggle */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Crie um código"
                      className="w-full h-12 px-4 text-center border-2 border-dashed border-muted-foreground/30 rounded-lg bg-transparent text-lg font-medium placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, code: generateRandomCode() })}
                      className="flex items-center gap-1.5 text-primary text-sm mt-2 hover:underline"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Gerar código aleatório
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Disponível</span>
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                  </div>
                </div>

                {/* Discount fields - R$ ou % */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Desconto:</span>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <CurrencyInput
                        value={fixedDiscount}
                        onChange={(value) => {
                          setFixedDiscount(value);
                          if (value > 0) setPercentDiscount('');
                        }}
                        placeholder="0,00"
                        className="w-24 pl-9"
                      />
                    </div>
                    <span className="text-muted-foreground">ou</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={percentDiscount}
                        onChange={(e) => {
                          setPercentDiscount(e.target.value);
                          if (e.target.value) setFixedDiscount(0);
                        }}
                        placeholder="0"
                        className="w-20 h-10 px-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  </div>
                </div>

                {/* Min order value */}
                {!showMinOrderField ? (
                  <button
                    type="button"
                    onClick={() => setShowMinOrderField(true)}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Definir preço mínimo para uso do cupom
                  </button>
                ) : (
                  <div>
                    <Label className="text-sm font-medium">Pedido mínimo (R$)</Label>
                    <CurrencyInput
                      value={formData.min_order_value}
                      onChange={(value) => setFormData({ ...formData, min_order_value: value })}
                      placeholder="0,00"
                      className="mt-1.5 w-full"
                    />
                  </div>
                )}

                {/* Visível para clientes toggle */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">Exibir para clientes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{formData.visible ? 'Visível' : 'Oculto'}</span>
                    <Switch
                      checked={formData.visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                    />
                  </div>
                </div>

                {/* Limite por cliente */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Limite por cliente <span className="text-muted-foreground font-normal">(opcional)</span></p>
                    <p className="text-xs text-muted-foreground">Limite que um cliente poderá usar este cupom</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={limitPerCustomer}
                    onChange={(e) => setLimitPerCustomer(e.target.value)}
                    placeholder=""
                    className="w-20 h-10 px-3 rounded-md border border-input bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Limite geral */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Limite geral <span className="text-muted-foreground font-normal">(opcional)</span></p>
                    <p className="text-xs text-muted-foreground">Quantas vezes esse cupom poderá ser usado.</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_uses ?? ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder=""
                    className="w-20 h-10 px-3 rounded-md border border-input bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Prazo de validade */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Prazo de validade <span className="text-muted-foreground font-normal">(opcional)</span></p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-primary text-xs mt-1.5 hover:underline"
                      >
                        <Clock className="w-3 h-3" />
                        Definir horário
                      </button>
                    </div>
                    <span className="text-muted-foreground text-sm">até</span>
                    <div className="flex-1">
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-primary text-xs mt-1.5 hover:underline"
                      >
                        <Clock className="w-3 h-3" />
                        Definir horário
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Planeje e agende seu cupom para campanhas promocionais.</p>
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="ghost" onClick={handleCloseModal}>
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createCoupon.isPending || updateCoupon.isPending}
                  >
                    {(createCoupon.isPending || updateCoupon.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Salvar cupom
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cupom será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!toggleCoupon} onOpenChange={() => setToggleCoupon(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleCoupon?.active ? 'Desativar cupom?' : 'Ativar cupom?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleCoupon?.active 
                ? `O cupom "${toggleCoupon?.code}" não poderá mais ser utilizado pelos clientes.`
                : `O cupom "${toggleCoupon?.code}" poderá ser utilizado pelos clientes.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmToggle}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {toggleCoupon?.active ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default CouponsPage;

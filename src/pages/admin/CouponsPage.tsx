import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Plus, Ticket, Eye, EyeOff, Pencil, Trash2, Loader2, X } from 'lucide-react';
import { useCoupons, Coupon, CouponFormData } from '@/hooks/useCoupons';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CurrencyInput } from '@/components/ui/currency-input';
import { format, parseISO } from 'date-fns';

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

  // Form state
  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    discount_type: 'percent',
    discount_value: 10,
    min_order_value: 0,
    max_uses: null,
    expires_at: null,
    active: true,
    visible: false,
  });

  // Campo formatado para exibição de porcentagem
  const [discountValueDisplay, setDiscountValueDisplay] = useState('10');

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percent',
      discount_value: 10,
      min_order_value: 0,
      max_uses: null,
      expires_at: null,
      active: true,
      visible: false,
    });
    setDiscountValueDisplay('10');
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
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : null,
        active: coupon.active,
        visible: coupon.visible,
      });
      setDiscountValueDisplay(coupon.discount_type === 'percent' 
        ? coupon.discount_value.toString()
        : ''
      );
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
    
    const dataToSubmit = {
      ...formData,
      expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
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

      {/* Create/Edit Panel */}
      {isModalOpen && (
        <>
          {/* Overlay - only on mobile */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 md:bg-transparent md:pointer-events-none"
            onClick={handleCloseModal}
          />
          
          {/* Panel */}
          <div className="fixed inset-0 md:left-64 md:right-0 md:top-0 md:bottom-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-border">
              <button 
                onClick={handleCloseModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold">
                {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
              </h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <form id="coupon-form" onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
                <div>
                  <Label htmlFor="code">Código do Cupom</Label>
                  <input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Ex: BEMVINDO10"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="discount_type">Tipo de Desconto</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(v) => {
                        const newType = v as 'percent' | 'fixed';
                        setFormData({ ...formData, discount_type: newType });
                        if (newType === 'percent') {
                          setDiscountValueDisplay(formData.discount_value.toString());
                        } else {
                          setDiscountValueDisplay(formData.discount_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount_value">
                      {formData.discount_type === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
                    </Label>
                    {formData.discount_type === 'percent' ? (
                      <input
                        id="discount_value"
                        type="number"
                        min="0"
                        max="100"
                        value={discountValueDisplay}
                        onChange={(e) => {
                          setDiscountValueDisplay(e.target.value);
                          setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 });
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                        required
                      />
                    ) : (
                      <CurrencyInput
                        id="discount_value"
                        value={formData.discount_value}
                        onChange={(value) => setFormData({ ...formData, discount_value: value })}
                        placeholder="0,00"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min_order_value">Pedido Mínimo (R$)</Label>
                    <CurrencyInput
                      id="min_order_value"
                      value={formData.min_order_value}
                      onChange={(value) => setFormData({ ...formData, min_order_value: value })}
                      placeholder="0,00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_uses">Limite de Usos</Label>
                    <input
                      id="max_uses"
                      type="number"
                      min="0"
                      value={formData.max_uses ?? ''}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Ilimitado"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="expires_at">Data de Expiração</Label>
                  <input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at ?? ''}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value || null })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active">Cupom Ativo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="visible"
                      checked={formData.visible}
                      onCheckedChange={(checked) => setFormData({ ...formData, visible: checked })}
                    />
                    <Label htmlFor="visible">Visível no Menu</Label>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <div className="max-w-2xl mx-auto flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  form="coupon-form"
                  disabled={createCoupon.isPending || updateCoupon.isPending}
                >
                  {(createCoupon.isPending || updateCoupon.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCoupon ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

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

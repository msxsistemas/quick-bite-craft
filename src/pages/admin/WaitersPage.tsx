import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { User, DollarSign, Plus, Pencil, Trash2, Phone, Loader2, TrendingUp, ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters, WaiterWithStats } from '@/hooks/useWaiters';

const waiterSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().trim().email('E-mail inválido').max(255, 'E-mail deve ter no máximo 255 caracteres').or(z.literal('')),
  phone: z.string().trim().min(1, 'Telefone é obrigatório'),
});

const formatCurrency = (value: number) => {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
};

const WaitersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(slug);
  const { 
    waiters, 
    isLoading: isLoadingWaiters, 
    totalTipsToday,
    totalRevenueToday,
    createWaiter, 
    updateWaiter, 
    deleteWaiter,
    toggleWaiterStatus 
  } = useWaiters(restaurant?.id);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<WaiterWithStats | null>(null);
  const [waiterName, setWaiterName] = useState('');
  const [waiterEmail, setWaiterEmail] = useState('');
  const [waiterPhone, setWaiterPhone] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // Delete state
  const [waiterToDelete, setWaiterToDelete] = useState<WaiterWithStats | null>(null);

  const activeWaiters = waiters.filter(w => w.active).length;

  const openCreateForm = () => {
    setEditingWaiter(null);
    setWaiterName('');
    setWaiterEmail('');
    setWaiterPhone('');
    setFormErrors({});
    setIsEditing(true);
  };

  const openEditForm = (waiter: WaiterWithStats) => {
    setEditingWaiter(waiter);
    setWaiterName(waiter.name);
    setWaiterEmail(waiter.email || '');
    setWaiterPhone(waiter.phone);
    setFormErrors({});
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    setEditingWaiter(null);
    setWaiterName('');
    setWaiterEmail('');
    setWaiterPhone('');
    setFormErrors({});
  };

  const validateForm = () => {
    const result = waiterSchema.safeParse({
      name: waiterName,
      email: waiterEmail,
      phone: waiterPhone,
    });

    if (!result.success) {
      const errors: { name?: string; email?: string; phone?: string } = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as 'name' | 'email' | 'phone';
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSaveWaiter = async () => {
    if (!validateForm()) return;

    if (editingWaiter) {
      await updateWaiter.mutateAsync({
        id: editingWaiter.id,
        name: waiterName.trim(),
        email: waiterEmail.trim() || null,
        phone: waiterPhone.trim(),
      });
    } else {
      await createWaiter.mutateAsync({
        name: waiterName.trim(),
        email: waiterEmail.trim() || undefined,
        phone: waiterPhone.trim(),
      });
    }
    closeForm();
  };

  const handleDeleteWaiter = async () => {
    if (!waiterToDelete) return;
    await deleteWaiter.mutateAsync(waiterToDelete.id);
    setWaiterToDelete(null);
  };

  const handleToggleStatus = (waiter: WaiterWithStats) => {
    toggleWaiterStatus.mutate({ id: waiter.id, active: !waiter.active });
  };

  const isLoading = isLoadingRestaurant || isLoadingWaiters;
  const isSaving = createWaiter.isPending || updateWaiter.isPending;
  const isDeleting = deleteWaiter.isPending;

  if (isLoading) {
    return (
      <AdminLayout type="restaurant" restaurantSlug={slug}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  // Fullscreen edit/create form
  if (isEditing) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <button onClick={closeForm} className="p-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {editingWaiter ? 'Editar garçom' : 'Novo garçom'}
          </h1>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Nome:</label>
            <Input
              value={waiterName}
              onChange={(e) => {
                setWaiterName(e.target.value);
                if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Nome do garçom"
              className={`h-12 bg-card border-border ${formErrors.name ? 'border-destructive' : ''}`}
            />
            {formErrors.name && (
              <p className="text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>

          {/* E-mail */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">E-mail:</label>
            <Input
              type="email"
              value={waiterEmail}
              onChange={(e) => {
                setWaiterEmail(e.target.value);
                if (formErrors.email) setFormErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="email@exemplo.com"
              className={`h-12 bg-card border-border ${formErrors.email ? 'border-destructive' : ''}`}
            />
            {formErrors.email ? (
              <p className="text-xs text-destructive">{formErrors.email}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Este email será utilizado pelo garçom para acessar o Aplicativo do Garçom
              </p>
            )}
          </div>

          {/* Número do WhatsApp */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Número do WhatsApp:</label>
            <PhoneInput
              value={waiterPhone}
              onChange={(val) => {
                setWaiterPhone(val);
                if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: undefined }));
              }}
              placeholder="(00) 0 0000-0000"
              className={`h-12 bg-card border-border ${formErrors.phone ? 'border-destructive' : ''}`}
            />
            {formErrors.phone ? (
              <p className="text-xs text-destructive">{formErrors.phone}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Informe o telefone para que seu garçom tenha acesso ao treinamento
              </p>
            )}
          </div>
        </div>

        {/* Footer button */}
        <div className="p-4 pb-6">
          <Button
            onClick={handleSaveWaiter}
            disabled={isSaving || !waiterName.trim() || !waiterPhone.trim()}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-xl"
          >
            {isSaving && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {editingWaiter ? 'Editar garçom' : 'Adicionar garçom'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie a equipe de garçons</p>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreateForm}>
            <Plus className="w-4 h-4" />
            Novo Garçom
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Garçons Ativos</p>
                <p className="text-xl font-bold text-foreground">{activeWaiters}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gorjetas Hoje</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalTipsToday)}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(totalRevenueToday)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Waiters Table */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-5 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Lista de Garçons</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Telefone</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Pedidos Hoje</th>
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Gorjetas Hoje</th>
                  <th className="text-right px-5 py-3 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {waiters.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      Nenhum garçom cadastrado. Clique em "Novo Garçom" para adicionar.
                    </td>
                  </tr>
                ) : (
                  waiters.map((waiter) => (
                    <tr key={waiter.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-4 text-sm font-medium text-foreground">{waiter.name}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {waiter.phone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={waiter.active}
                            onCheckedChange={() => handleToggleStatus(waiter)}
                            disabled={toggleWaiterStatus.isPending}
                            className="data-[state=checked]:bg-amber-500"
                          />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            waiter.active ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {waiter.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">{waiter.ordersToday}</td>
                      <td className="px-5 py-4 text-sm font-medium text-green-600">
                        {formatCurrency(waiter.tipsToday)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditForm(waiter)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => setWaiterToDelete(waiter)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={!!waiterToDelete}
        onOpenChange={(open) => !open && setWaiterToDelete(null)}
        onConfirm={handleDeleteWaiter}
        title="Remover Garçom"
        description={`Tem certeza que deseja remover "${waiterToDelete?.name}"? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
};

export default WaitersPage;
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { User, DollarSign, Plus, Pencil, Trash2, Phone, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import { useWaiters, Waiter } from '@/hooks/useWaiters';

const WaitersPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: isLoadingRestaurant } = useRestaurantBySlug(slug);
  const { 
    waiters, 
    isLoading: isLoadingWaiters, 
    createWaiter, 
    updateWaiter, 
    deleteWaiter,
    toggleWaiterStatus 
  } = useWaiters(restaurant?.id);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [waiterName, setWaiterName] = useState('');
  const [waiterPhone, setWaiterPhone] = useState('');

  // Delete state
  const [waiterToDelete, setWaiterToDelete] = useState<Waiter | null>(null);

  const activeWaiters = waiters.filter(w => w.active).length;
  // TODO: Implement tips calculation when orders are associated with waiters
  const totalTips = 0;

  const openCreateModal = () => {
    setEditingWaiter(null);
    setWaiterName('');
    setWaiterPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setWaiterName(waiter.name);
    setWaiterPhone(waiter.phone);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWaiter(null);
    setWaiterName('');
    setWaiterPhone('');
  };

  const handleSaveWaiter = async () => {
    if (!waiterName.trim() || !waiterPhone.trim()) return;

    if (editingWaiter) {
      await updateWaiter.mutateAsync({
        id: editingWaiter.id,
        name: waiterName.trim(),
        phone: waiterPhone.trim(),
      });
    } else {
      await createWaiter.mutateAsync({
        name: waiterName.trim(),
        phone: waiterPhone.trim(),
      });
    }
    closeModal();
  };

  const handleDeleteWaiter = async () => {
    if (!waiterToDelete) return;
    await deleteWaiter.mutateAsync(waiterToDelete.id);
    setWaiterToDelete(null);
  };

  const handleToggleStatus = (waiter: Waiter) => {
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

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gerencie a equipe de garçons</p>
          </div>
          <Button size="sm" className="gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Novo Garçom
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
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
                <p className="text-xl font-bold text-foreground">R$ {totalTips.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
                <p className="text-xl font-bold text-foreground">R$ 0,00</p>
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
                  <th className="text-left px-5 py-3 text-sm font-medium text-muted-foreground">Mesas Hoje</th>
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
                      <td className="px-5 py-4 text-sm text-muted-foreground">0</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">R$ 0,00</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(waiter)}
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

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWaiter ? 'Editar Garçom' : 'Novo Garçom'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Nome</label>
              <Input
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="Nome do garçom"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Telefone</label>
              <PhoneInput
                value={waiterPhone}
                onChange={setWaiterPhone}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={closeModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveWaiter}
              disabled={isSaving || !waiterName.trim() || !waiterPhone.trim()}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingWaiter ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

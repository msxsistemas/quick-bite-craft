import { ArrowLeft, Search, Plus, Edit, Copy, Phone, Trash2, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Waiter {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  ordersToday?: number;
}

interface WaiterListViewProps {
  onBack: () => void;
  waiters: Waiter[];
  onCreateWaiter?: (name: string, phone: string) => Promise<void>;
  onToggleWaiterStatus?: (waiterId: string, active: boolean) => Promise<void>;
  onUpdateWaiter?: (waiterId: string, name: string, phone: string) => Promise<void>;
  onDeleteWaiter?: (waiterId: string) => Promise<void>;
  restaurantSlug?: string;
}

export const WaiterListView = ({ 
  onBack, 
  waiters,
  onCreateWaiter,
  onToggleWaiterStatus,
  onUpdateWaiter,
  onDeleteWaiter,
  restaurantSlug
}: WaiterListViewProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete confirmation state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [waiterToDelete, setWaiterToDelete] = useState<Waiter | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle confirmation state (for waiters with pending orders)
  const [isToggleDialogOpen, setIsToggleDialogOpen] = useState(false);
  const [waiterToToggle, setWaiterToToggle] = useState<Waiter | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPhone(formatPhone(e.target.value));
  };

  const handleEditPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async () => {
    if (!newName.trim()) {
      toast.error('Preencha o nome');
      return;
    }

    if (isManualMode) {
      if (!newEmail.trim() || !newPassword.trim()) {
        toast.error('Preencha todos os campos');
        return;
      }
    } else {
      if (!newPhone.trim()) {
        toast.error('Preencha o número do WhatsApp');
        return;
      }
    }

    if (onCreateWaiter) {
      setIsSubmitting(true);
      try {
        await onCreateWaiter(newName.trim(), newPhone.replace(/\D/g, ''));
        resetForm();
        toast.success('Garçom cadastrado com sucesso!');
      } catch (error) {
        toast.error('Erro ao cadastrar garçom');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewPhone('');
    setIsAdding(false);
    setIsManualMode(false);
  };

  const handleCopyLink = () => {
    const baseUrl = window.location.origin;
    const link = restaurantSlug 
      ? `${baseUrl}/${restaurantSlug}/waiter`
      : window.location.href;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  const handleSendWhatsAppLink = (waiter: Waiter) => {
    if (!waiter.phone) {
      toast.error('Este garçom não possui número de telefone cadastrado');
      return;
    }

    const baseUrl = window.location.origin;
    const accessLink = restaurantSlug 
      ? `${baseUrl}/${restaurantSlug}/waiter`
      : window.location.href;
    
    const phone = waiter.phone.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    const message = encodeURIComponent(
      `Olá ${waiter.name}! 👋\n\n` +
      `Você foi cadastrado como garçom no nosso sistema.\n\n` +
      `Acesse o aplicativo através do link abaixo:\n${accessLink}\n\n` +
      `Selecione seu nome na lista para começar a atender! 🚀`
    );
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Link enviado via WhatsApp!');
  };

  const handleOpenEditModal = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    setEditName(waiter.name);
    setEditPhone(formatPhone(waiter.phone));
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingWaiter(null);
    setEditName('');
    setEditPhone('');
  };

  const handleUpdateWaiter = async () => {
    if (!editingWaiter || !editName.trim()) {
      toast.error('Preencha o nome');
      return;
    }

    if (!editPhone.trim()) {
      toast.error('Preencha o telefone');
      return;
    }

    if (onUpdateWaiter) {
      setIsUpdating(true);
      try {
        await onUpdateWaiter(
          editingWaiter.id, 
          editName.trim(), 
          editPhone.replace(/\D/g, '')
        );
        handleCloseEditModal();
        toast.success('Garçom atualizado com sucesso!');
      } catch (error) {
        toast.error('Erro ao atualizar garçom');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Handle delete with confirmation
  const handleOpenDeleteDialog = (waiter: Waiter) => {
    setWaiterToDelete(waiter);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!waiterToDelete || !onDeleteWaiter) return;

    setIsDeleting(true);
    try {
      await onDeleteWaiter(waiterToDelete.id);
      setIsDeleteDialogOpen(false);
      setWaiterToDelete(null);
    } catch (error) {
      toast.error('Erro ao excluir garçom');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle toggle with confirmation for waiters with pending orders
  const handleToggleStatus = async (waiter: Waiter, newActive: boolean) => {
    // If deactivating and waiter has pending orders, show confirmation
    if (!newActive && waiter.ordersToday && waiter.ordersToday > 0) {
      setWaiterToToggle(waiter);
      setIsToggleDialogOpen(true);
      return;
    }

    // Otherwise, toggle directly
    if (onToggleWaiterStatus) {
      await onToggleWaiterStatus(waiter.id, newActive);
    }
  };

  const handleConfirmToggle = async () => {
    if (!waiterToToggle || !onToggleWaiterStatus) return;

    setIsToggling(true);
    try {
      await onToggleWaiterStatus(waiterToToggle.id, false);
      setIsToggleDialogOpen(false);
      setWaiterToToggle(null);
    } catch (error) {
      toast.error('Erro ao desativar garçom');
    } finally {
      setIsToggling(false);
    }
  };

  const filteredWaiters = useMemo(() => {
    const isActive = activeTab === 'active';
    return waiters.filter(w => {
      const matchesStatus = w.active === isActive;
      const matchesSearch = !searchQuery || 
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.phone.includes(searchQuery.replace(/\D/g, ''));
      return matchesStatus && matchesSearch;
    });
  }, [waiters, activeTab, searchQuery]);

  const activeCount = waiters.filter(w => w.active).length;
  const inactiveCount = waiters.filter(w => !w.active).length;

  // Add Waiter View
  if (isAdding) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex flex-col">
        {/* Header */}
        <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button 
            onClick={resetForm}
            className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-lg">Criar garçom</h1>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 space-y-6">
          {!isManualMode ? (
            <>
              {/* Invite Mode */}
              <p className="text-slate-300 text-sm">
                Preencha os campos abaixo com das informações do seu garçom e clique no botão enviar convite.
              </p>
              <p className="text-slate-400 text-sm">
                Após clicar em enviar, este número receberá uma mensagem com o link para finalizar o cadastro e acessar o aplicativo.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">Nome:</label>
                  <Input
                    placeholder="Ex.: Everaldo Santos"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">Número do WhatsApp:</label>
                  <Input
                    placeholder="(__) _____-____"
                    value={newPhone}
                    onChange={handlePhoneChange}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Número do WhatsApp do garçom para envio do link de finalização do cadastro e mais informações.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-[#1e4976]" />
                <span className="text-slate-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-[#1e4976]" />
              </div>

              <button
                onClick={() => setIsManualMode(true)}
                className="w-full text-cyan-400 font-medium py-2 hover:text-cyan-300 transition-colors"
              >
                Cadastrar garçom manualmente
              </button>

              <div className="text-center pt-4">
                <p className="text-slate-400 text-sm">Dúvidas com o convite?</p>
                <a href="#" className="text-cyan-400 text-sm hover:underline">Acesse nossa Central de Ajuda</a>
              </div>
            </>
          ) : (
            <>
              {/* Manual Mode */}
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium block mb-2">Nome:</label>
                  <Input
                    placeholder="Ex.: Everaldo Santos"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">E-mail:</label>
                  <Input
                    type="email"
                    placeholder="Ex.: everaldo@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Este email será utilizado pelo garçom para acessar o Aplicativo do Garçom
                  </p>
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">Senha:</label>
                  <Input
                    type="password"
                    placeholder="Senha do garçom"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Senha do garçom para acessar o Aplicativo do Garçom. Precisa ter pelo menos 8 caracteres
                  </p>
                </div>

                <div>
                  <label className="text-white text-sm font-medium block mb-2">Número do WhatsApp:</label>
                  <Input
                    placeholder="(__) _____-____"
                    value={newPhone}
                    onChange={handlePhoneChange}
                    className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Informe o telefone para que seu garçom tenha acesso ao treinamento
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 h-px bg-[#1e4976]" />
                <span className="text-slate-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-[#1e4976]" />
              </div>

              <button
                onClick={() => setIsManualMode(false)}
                className="w-full text-cyan-400 font-medium py-2 hover:text-cyan-300 transition-colors"
              >
                Cadastrar garçom via convite
              </button>
            </>
          )}
        </div>

        {/* Fixed Bottom Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1628]">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-cyan-500 rounded-lg text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-white font-semibold text-lg">Meus Garçons</h1>
        </div>
        {onCreateWaiter && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-3 py-2 text-cyan-400 hover:bg-[#1e4976] rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Garçom
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'active' 
              ? 'bg-cyan-500 text-white' 
              : 'bg-[#0d2847] text-slate-400 hover:text-white'
          }`}
        >
          Ativos <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{activeCount}</span>
        </button>
        <button
          onClick={() => setActiveTab('inactive')}
          className={`flex-1 py-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'inactive' 
              ? 'bg-cyan-500 text-white' 
              : 'bg-[#0d2847] text-slate-400 hover:text-white'
          }`}
        >
          Inativos <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{inactiveCount}</span>
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-[#0d2847] border-b border-[#1e4976]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Busque por nome, e-mail ou telefone"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-[#0a1628] border-[#1e4976] text-white placeholder:text-slate-500 h-12 rounded-xl"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-24">
        {filteredWaiters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-slate-400">
              {searchQuery 
                ? 'Nenhum garçom encontrado' 
                : activeTab === 'active' 
                  ? 'Nenhum garçom ativo' 
                  : 'Nenhum garçom inativo'
              }
            </p>
          </div>
        ) : (
          filteredWaiters.map((waiter) => (
            <div
              key={waiter.id}
              className="px-4 py-4 border-b border-[#1e4976]/50 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                {onToggleWaiterStatus && (
                  <Switch
                    checked={waiter.active}
                    onCheckedChange={(checked) => handleToggleStatus(waiter, checked)}
                    className="mt-1"
                  />
                )}
                <div>
                  <p className="text-white font-medium">{waiter.name}</p>
                  <p className="text-slate-400 text-sm">{waiter.phone ? formatPhone(waiter.phone) : 'Sem telefone'}</p>
                  <button 
                    onClick={() => handleSendWhatsAppLink(waiter)}
                    className="text-cyan-400 text-sm flex items-center gap-1 mt-1 hover:underline"
                  >
                    Enviar link de acesso
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenEditModal(waiter)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                {onDeleteWaiter && (
                  <button 
                    onClick={() => handleOpenDeleteDialog(waiter)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0d2847] border-t border-[#1e4976]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Compartilhe o App</p>
            <p className="text-slate-400 text-xs">Copie o link do app para compartilhar com sua equipe.</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </button>
        </div>
      </div>

      {/* Edit Waiter Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-[#0d2847] border-[#1e4976] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Editar garçom</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-white text-sm font-medium block mb-2">Nome:</label>
              <Input
                placeholder="Nome do garçom"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
              />
            </div>

            <div>
              <label className="text-white text-sm font-medium block mb-2">Número do WhatsApp:</label>
              <Input
                placeholder="(__) _____-____"
                value={editPhone}
                onChange={handleEditPhoneChange}
                className="bg-white border-none text-gray-900 placeholder:text-gray-400 h-12"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCloseEditModal}
                disabled={isUpdating}
                className="flex-1 py-3 border border-[#1e4976] rounded-xl text-slate-400 font-medium hover:bg-[#1e4976] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateWaiter}
                disabled={isUpdating || !editName.trim() || !editPhone.trim()}
                className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
              {isUpdating ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0d2847] border-[#1e4976]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Excluir garçom permanentemente
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Tem certeza que deseja excluir <span className="text-white font-medium">{waiterToDelete?.name}</span> permanentemente? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isDeleting}
              className="border-[#1e4976] bg-transparent text-slate-400 hover:bg-[#1e4976] hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Toggle Confirmation Dialog (for waiters with pending orders) */}
      <AlertDialog open={isToggleDialogOpen} onOpenChange={setIsToggleDialogOpen}>
        <AlertDialogContent className="bg-[#0d2847] border-[#1e4976]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              Desativar garçom com pedidos pendentes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              <span className="text-white font-medium">{waiterToToggle?.name}</span> possui{' '}
              <span className="text-amber-400 font-medium">{waiterToToggle?.ordersToday} pedido(s)</span> hoje.
              <br /><br />
              Deseja desativar este garçom mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={isToggling}
              className="border-[#1e4976] bg-transparent text-slate-400 hover:bg-[#1e4976] hover:text-white"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggle}
              disabled={isToggling}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isToggling ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
import { ArrowLeft, Search, Plus, Edit, Copy, Phone } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Waiter {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

interface WaiterListViewProps {
  onBack: () => void;
  waiters: Waiter[];
  onCreateWaiter?: (name: string, phone: string) => Promise<void>;
  onToggleWaiterStatus?: (waiterId: string, active: boolean) => Promise<void>;
}

export const WaiterListView = ({ 
  onBack, 
  waiters,
  onCreateWaiter,
  onToggleWaiterStatus 
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

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPhone(formatPhone(e.target.value));
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
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
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
                    onCheckedChange={(checked) => onToggleWaiterStatus(waiter.id, checked)}
                    className="mt-1"
                  />
                )}
                <div>
                  <p className="text-white font-medium">{waiter.name}</p>
                  <p className="text-slate-400 text-sm">{waiter.phone ? formatPhone(waiter.phone) : 'Sem telefone'}</p>
                  <button className="text-cyan-400 text-sm flex items-center gap-1 mt-1 hover:underline">
                    Enviar link de acesso
                    <Phone className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <Edit className="w-5 h-5" />
              </button>
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
    </div>
  );
};
import { ArrowLeft, User, Phone, Plus, Check, X } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
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
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (onCreateWaiter) {
      setIsSubmitting(true);
      try {
        await onCreateWaiter(newName.trim(), newPhone.replace(/\D/g, ''));
        setNewName('');
        setNewPhone('');
        setIsAdding(false);
        toast.success('Garçom cadastrado com sucesso!');
      } catch (error) {
        toast.error('Erro ao cadastrar garçom');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCancel = () => {
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

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
        {!isAdding && onCreateWaiter && (
          <button
            onClick={() => setIsAdding(true)}
            className="p-2 text-cyan-400 hover:bg-[#1e4976] rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3">
        {/* Add New Waiter Form */}
        {isAdding && (
          <div className="bg-[#0d2847] border border-cyan-500 rounded-xl p-4 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-white font-semibold">Novo Garçom</h3>
            <div className="space-y-3">
              <Input
                placeholder="Nome do garçom"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-[#0a1628] border-[#1e4976] text-white placeholder:text-slate-500"
              />
              <Input
                placeholder="Telefone (00) 00000-0000"
                value={newPhone}
                onChange={handlePhoneChange}
                className="bg-[#0a1628] border-[#1e4976] text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 py-3 border border-[#1e4976] rounded-xl text-slate-400 font-medium hover:bg-[#1e4976] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !newName.trim() || !newPhone.trim()}
                className="flex-1 py-3 bg-cyan-500 rounded-xl text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Waiter List */}
        {waiters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-2">Nenhum garçom cadastrado</p>
            <p className="text-sm text-slate-500">Toque no + para adicionar</p>
          </div>
        ) : (
          waiters.map((waiter) => (
            <div
              key={waiter.id}
              className={`bg-[#0d2847] border rounded-xl p-4 flex items-center justify-between ${
                waiter.active ? 'border-[#1e4976]' : 'border-slate-600 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  waiter.active ? 'bg-cyan-500/20' : 'bg-slate-600/20'
                }`}>
                  <User className={`w-5 h-5 ${waiter.active ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">{waiter.name}</p>
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <Phone className="w-3 h-3" />
                    <span>{formatPhone(waiter.phone)}</span>
                  </div>
                </div>
              </div>
              
              {onToggleWaiterStatus && (
                <button
                  onClick={() => onToggleWaiterStatus(waiter.id, !waiter.active)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    waiter.active 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-slate-600/20 text-slate-400 hover:bg-slate-600/30'
                  }`}
                >
                  {waiter.active ? 'Ativo' : 'Inativo'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

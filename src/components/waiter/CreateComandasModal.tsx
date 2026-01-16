import { useState } from 'react';
import { X, Minus, Plus, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface CreateComandasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateComandas: (count: number, startNumber: number) => Promise<void>;
  isCreating: boolean;
  nextNumber: string;
}

export const CreateComandasModal = ({
  isOpen,
  onClose,
  onCreateComandas,
  isCreating,
  nextNumber
}: CreateComandasModalProps) => {
  const [count, setCount] = useState(1);
  const [startNumber, setStartNumber] = useState(nextNumber);

  if (!isOpen) return null;

  const handleDecrement = () => {
    if (count > 1) setCount(count - 1);
  };

  const handleIncrement = () => {
    if (count < 100) setCount(count + 1);
  };

  const handleCreate = async () => {
    const start = parseInt(startNumber) || parseInt(nextNumber);
    await onCreateComandas(count, start);
    setCount(1);
    setStartNumber(nextNumber);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Criar comandas</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Start Number */}
          <div>
            <p className="text-gray-900 font-medium mb-2">Começar a partir do número:</p>
            <Input
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              min={1}
              className="bg-gray-50 border-gray-200 text-gray-900 h-12 rounded-lg text-center text-lg font-medium"
            />
          </div>

          {/* Count */}
          <div>
            <p className="text-gray-900 font-medium mb-1">Quantas comandas você deseja criar?</p>
            <p className="text-gray-500 text-sm mb-4">Limite máximo de 100 comandas por vez</p>

            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleDecrement}
                disabled={count <= 1}
                className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
              </button>
              
              <span className="text-2xl font-bold text-gray-900 w-12 text-center">{count}</span>
              
              <button
                onClick={handleIncrement}
                disabled={count >= 100}
                className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4">
          <button
            onClick={handleCreate}
            disabled={isCreating || !startNumber}
            className="w-full py-4 bg-cyan-500 rounded-xl text-white font-semibold hover:bg-cyan-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

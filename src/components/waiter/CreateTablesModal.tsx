import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';

interface CreateTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTables: (count: number) => void;
  isCreating: boolean;
}

export const CreateTablesModal = ({ 
  isOpen, 
  onClose, 
  onCreateTables, 
  isCreating 
}: CreateTablesModalProps) => {
  const [tableCount, setTableCount] = useState(1);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (tableCount < 100) {
      setTableCount(tableCount + 1);
    }
  };

  const handleDecrement = () => {
    if (tableCount > 1) {
      setTableCount(tableCount - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Criar mesas</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-900 font-medium mb-1">Quantas mesas você deseja criar?</p>
            <p className="text-sm text-gray-500">Limite máximo de 100 mesas por vez</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <button
              onClick={handleDecrement}
              disabled={tableCount <= 1}
              className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="text-2xl font-bold text-gray-900 w-12 text-center">{tableCount}</span>
            <button
              onClick={handleIncrement}
              disabled={tableCount >= 100}
              className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => onCreateTables(tableCount)}
          disabled={isCreating}
          className="w-full py-4 bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Criando...' : 'Criar'}
        </button>
      </div>
    </div>
  );
};

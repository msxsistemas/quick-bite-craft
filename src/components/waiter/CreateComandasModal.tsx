import { useState } from 'react';
import { X, Minus, Plus } from 'lucide-react';

interface CreateComandasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateComandas: (count: number) => Promise<void>;
  isCreating: boolean;
}

export const CreateComandasModal = ({ 
  isOpen, 
  onClose, 
  onCreateComandas, 
  isCreating 
}: CreateComandasModalProps) => {
  const [count, setCount] = useState(1);
  const [inputValue, setInputValue] = useState('1');
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleIncrement = () => {
    if (count < 100) {
      const newValue = count + 1;
      setCount(newValue);
      setInputValue(String(newValue));
      setHasError(false);
    }
  };

  const handleDecrement = () => {
    if (count > 1) {
      const newValue = count - 1;
      setCount(newValue);
      setInputValue(String(newValue));
      setHasError(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value === '') {
      setHasError(false);
      return;
    }
    
    const numValue = parseInt(value) || 0;
    if (numValue < 1 || numValue > 100) {
      setHasError(true);
    } else {
      setHasError(false);
      setCount(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue) || 0;
    if (numValue < 1) {
      setCount(1);
      setInputValue('1');
    } else if (numValue > 100) {
      setCount(100);
      setInputValue('100');
    }
    setHasError(false);
  };

  const handleCreate = async () => {
    await onCreateComandas(count);
    setCount(1);
    setInputValue('1');
  };

  const isValidCount = count >= 1 && count <= 100 && !hasError;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 pb-[1vh]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[99%] max-w-none bg-white rounded-2xl animate-in slide-in-from-bottom duration-300 flex flex-col mb-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Criar comandas</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-900 font-medium mb-1">Quantas comandas você deseja criar?</p>
            <p className="text-sm text-gray-500">Limite máximo de 100 comandas por vez</p>
          </div>

          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleDecrement}
                disabled={count <= 1}
                className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                min={1}
                max={100}
                className={`text-2xl font-bold w-16 text-center border-2 rounded-lg outline-none bg-transparent transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  hasError 
                    ? 'border-red-500 text-red-500 focus:border-red-500' 
                    : 'border-transparent text-gray-900 focus:border-cyan-500'
                }`}
              />
              <button
                onClick={handleIncrement}
                disabled={count >= 100}
                className="w-10 h-10 rounded-full bg-cyan-500 text-white flex items-center justify-center hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {hasError && (
              <p className="text-red-500 text-sm animate-in fade-in duration-200">
                Digite um valor entre 1 e 100
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={isCreating || !isValidCount}
          className="w-full py-4 bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Criando...' : 'Criar'}
        </button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BottomSheet, BottomSheetHeader, BottomSheetContent, BottomSheetFooter } from '@/components/ui/bottom-sheet';

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
    <BottomSheet open={isOpen} onClose={onClose}>
      <BottomSheetHeader className="border-b-0 pb-0">
        <h2 className="text-lg font-bold text-foreground">Criar comandas</h2>
      </BottomSheetHeader>

      <BottomSheetContent className="px-6 pb-6">
        <div className="mb-6">
          <p className="text-foreground font-medium mb-1">Quantas comandas você deseja criar?</p>
          <p className="text-sm text-muted-foreground">Limite máximo de 100 comandas por vez</p>
        </div>

        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={handleDecrement}
              disabled={count <= 1}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  ? 'border-destructive text-destructive focus:border-destructive' 
                  : 'border-transparent text-foreground focus:border-primary'
              }`}
            />
            <button
              onClick={handleIncrement}
              disabled={count >= 100}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {hasError && (
            <p className="text-destructive text-sm animate-in fade-in duration-200">
              Digite um valor entre 1 e 100
            </p>
          )}
        </div>
      </BottomSheetContent>

      <BottomSheetFooter className="border-t-0 pt-0 px-0">
        <button
          onClick={handleCreate}
          disabled={isCreating || !isValidCount}
          className="w-full py-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-b-2xl"
        >
          {isCreating ? 'Criando...' : 'Criar'}
        </button>
      </BottomSheetFooter>
    </BottomSheet>
  );
};

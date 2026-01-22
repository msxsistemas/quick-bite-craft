import { X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface CloseTableConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export const CloseTableConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: CloseTableConfirmDialogProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-white rounded-t-2xl p-0" hideCloseButton>
        <SheetHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <SheetTitle className="text-black font-semibold">Fechar conta</SheetTitle>
          <button onClick={() => onOpenChange(false)} className="p-1 text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          <p className="text-gray-700">Tem certeza que deseja fechar a mesa?</p>

          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="w-full py-4 bg-cyan-500 rounded-xl text-white font-bold hover:bg-cyan-400 transition-colors"
          >
            Fechar a mesa
          </button>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full py-4 border-2 border-cyan-500 rounded-xl text-cyan-500 font-bold hover:bg-cyan-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

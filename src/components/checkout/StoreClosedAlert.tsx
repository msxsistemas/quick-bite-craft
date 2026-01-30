import { Store } from 'lucide-react';

export const StoreClosedAlert: React.FC = () => {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center gap-3">
      <Store className="w-6 h-6 text-destructive" />
      <div>
        <p className="font-semibold text-destructive">Loja fechada</p>
        <p className="text-sm text-destructive/80">Não estamos aceitando pedidos no momento</p>
      </div>
    </div>
  );
};

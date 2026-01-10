import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Store, Users, ChevronRight } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div>
          <div className="w-24 h-24 bg-warning rounded-full flex items-center justify-center mx-auto mb-6 shadow-delivery-lg">
            <UtensilsCrossed className="w-12 h-12 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Delivery Express</h1>
          <p className="text-muted-foreground mt-2">
            Sistema completo de delivery para restaurantes
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <button
            onClick={() => navigate('/r/burger-house')}
            className="w-full delivery-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
          >
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Ver Cardápio</p>
              <p className="text-sm text-muted-foreground">Acesse o cardápio do restaurante</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => navigate('/r/burger-house/admin')}
            className="w-full delivery-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
          >
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Painel do Restaurante</p>
              <p className="text-sm text-muted-foreground">Gerencie pedidos e produtos</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-success transition-colors" />
          </button>

          <button
            onClick={() => navigate('/reseller')}
            className="w-full delivery-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
          >
            <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-foreground">Painel do Revendedor</p>
              <p className="text-sm text-muted-foreground">Gerencie restaurantes e usuários</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-warning transition-colors" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Versão Demo • Todos os dados são fictícios
        </p>
      </div>
    </div>
  );
};

export default Index;

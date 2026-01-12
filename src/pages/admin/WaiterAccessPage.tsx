import { useParams } from 'react-router-dom';
import { User } from 'lucide-react';

const WaiterAccessPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const waiters = [
    { id: 1, name: 'João Santos' },
    { id: 2, name: 'Maria Oliveira' },
    { id: 3, name: 'Pedro Costa' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          {/* Logo/Image */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-800 to-amber-950 rounded-full flex items-center justify-center overflow-hidden">
              <span className="text-3xl">🍔</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">Olá, Garçom!</h1>
            <p className="text-muted-foreground">Selecione seu nome para acessar o sistema</p>
          </div>

          {/* Waiter List */}
          <div className="space-y-3">
            {waiters.map((waiter) => (
              <button
                key={waiter.id}
                className="w-full flex items-center gap-4 p-4 border border-border rounded-xl hover:border-amber-300 hover:bg-amber-50/50 transition-all"
              >
                <User className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{waiter.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterAccessPage;

import { useParams, Link } from 'react-router-dom';
import { ChefHat, Clock, Volume2, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';

const KitchenPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const statusCards = [
    { icon: Clock, label: 'Pendentes', count: 0, bgColor: 'bg-yellow-100', textColor: 'text-yellow-600', borderColor: 'border-yellow-400' },
    { icon: ChefHat, label: 'Preparando', count: 0, bgColor: 'bg-blue-100', textColor: 'text-blue-600', borderColor: 'border-blue-400' },
    { icon: CheckCircle, label: 'Prontos', count: 1, bgColor: 'bg-green-100', textColor: 'text-green-600', borderColor: 'border-green-400' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Cozinha</h1>
              <p className="text-sm text-muted-foreground">Burger House Gourmet</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link 
              to={`/r/${slug}/admin/dashboard`}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statusCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-6 text-center border-2 ${card.borderColor}`}
            >
              <card.icon className={`w-6 h-6 mx-auto mb-2 ${card.textColor}`} />
              <p className={`text-3xl font-bold ${card.textColor}`}>{card.count}</p>
              <p className={`text-sm font-medium ${card.textColor}`}>{card.label}</p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Nenhum item pendente</p>
        </div>
      </main>
    </div>
  );
};

export default KitchenPage;

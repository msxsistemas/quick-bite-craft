import { ArrowLeft, Trophy, Star, Target, Flame, Gift, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: string;
  icon: 'star' | 'target' | 'flame' | 'gift' | 'trophy';
  completed: boolean;
  locked: boolean;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
}

export const WaiterChallengesView = ({ onBack, waiterName }: WaiterChallengesViewProps) => {
  // Mock challenges data
  const challenges: Challenge[] = [
    {
      id: '1',
      title: 'Primeiro pedido do dia',
      description: 'Registre o primeiro pedido do dia',
      target: 1,
      current: 1,
      reward: 'R$ 5,00 bônus',
      icon: 'star',
      completed: true,
      locked: false,
    },
    {
      id: '2',
      title: 'Vendedor de bebidas',
      description: 'Venda 10 bebidas hoje',
      target: 10,
      current: 7,
      reward: 'R$ 15,00 bônus',
      icon: 'target',
      completed: false,
      locked: false,
    },
    {
      id: '3',
      title: 'Atendimento rápido',
      description: 'Feche 5 mesas em menos de 30 minutos',
      target: 5,
      current: 2,
      reward: 'R$ 20,00 bônus',
      icon: 'flame',
      completed: false,
      locked: false,
    },
    {
      id: '4',
      title: 'Mestre das sobremesas',
      description: 'Venda 5 sobremesas hoje',
      target: 5,
      current: 0,
      reward: 'R$ 10,00 bônus',
      icon: 'gift',
      completed: false,
      locked: false,
    },
    {
      id: '5',
      title: 'Campeão do dia',
      description: 'Complete todos os desafios diários',
      target: 4,
      current: 1,
      reward: 'R$ 50,00 bônus',
      icon: 'trophy',
      completed: false,
      locked: true,
    },
  ];

  const completedCount = challenges.filter(c => c.completed).length;
  const totalReward = challenges
    .filter(c => c.completed)
    .reduce((sum) => sum + 5, 0); // Simplified reward calculation

  const getIcon = (icon: Challenge['icon']) => {
    switch (icon) {
      case 'star': return Star;
      case 'target': return Target;
      case 'flame': return Flame;
      case 'gift': return Gift;
      default: return Trophy;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-lg">Desafios Garçom</h1>
      </header>

      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 mx-4 mt-4 rounded-xl">
        <p className="text-cyan-100 text-sm">Olá, {waiterName}!</p>
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="text-white text-2xl font-bold">{completedCount}/{challenges.length}</p>
            <p className="text-cyan-100 text-sm">Desafios completos</p>
          </div>
          <div className="text-right">
            <p className="text-white text-2xl font-bold">{formatCurrency(totalReward)}</p>
            <p className="text-cyan-100 text-sm">Bônus acumulado</p>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="flex-1 p-4 space-y-3">
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wide">Desafios de Hoje</h2>
        
        {challenges.map((challenge) => {
          const Icon = getIcon(challenge.icon);
          const progress = (challenge.current / challenge.target) * 100;

          return (
            <div
              key={challenge.id}
              className={`bg-[#0d2847] border rounded-xl p-4 ${
                challenge.locked 
                  ? 'border-slate-600 opacity-60' 
                  : challenge.completed 
                    ? 'border-green-500/50' 
                    : 'border-[#1e4976]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  challenge.locked
                    ? 'bg-slate-600/20'
                    : challenge.completed 
                      ? 'bg-green-500/20' 
                      : 'bg-cyan-500/20'
                }`}>
                  {challenge.locked ? (
                    <Lock className="w-5 h-5 text-slate-500" />
                  ) : (
                    <Icon className={`w-5 h-5 ${
                      challenge.completed ? 'text-green-400' : 'text-cyan-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-medium">{challenge.title}</h3>
                    {challenge.completed && (
                      <span className="text-green-400 text-sm">✓ Completo</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{challenge.description}</p>
                  
                  {!challenge.locked && !challenge.completed && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">{challenge.current}/{challenge.target}</span>
                        <span className="text-cyan-400">{challenge.reward}</span>
                      </div>
                      <div className="h-2 bg-[#1e4976] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {challenge.completed && (
                    <p className="text-sm text-green-400 mt-2">Bônus: {challenge.reward}</p>
                  )}
                  
                  {challenge.locked && (
                    <p className="text-sm text-slate-500 mt-2">Complete os outros desafios para desbloquear</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

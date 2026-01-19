import { ArrowLeft, Smile } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  color: 'blue' | 'bronze' | 'gold' | 'locked';
  icon?: string;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
}

const badges: Badge[] = [
  { id: '1', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, color: 'blue', icon: '🎀' },
  { id: '2', name: 'Iniciante', description: 'primeiro pedido', requiredOrders: 1, color: 'bronze' },
  { id: '3', name: 'Aprendiz', description: '5 pedidos', requiredOrders: 5, color: 'bronze' },
  { id: '4', name: 'Profissional', description: '10 pedidos', requiredOrders: 10, color: 'blue' },
  { id: '5', name: 'Avançado', description: '15 pedidos', requiredOrders: 15, color: 'gold' },
  { id: '6', name: 'Sênior', description: '20 pedidos', requiredOrders: 20, color: 'gold' },
  { id: '7', name: 'Veterano', description: '40 pedidos', requiredOrders: 40, color: 'locked' },
  { id: '8', name: 'Exemplar', description: '80 pedidos', requiredOrders: 80, color: 'locked' },
  { id: '9', name: 'Especialista', description: '150 pedidos', requiredOrders: 150, color: 'locked' },
  { id: '10', name: 'Maestro', description: '200 pedidos', requiredOrders: 200, color: 'locked' },
  { id: '11', name: 'Guru', description: '300 pedidos', requiredOrders: 300, color: 'locked' },
  { id: '12', name: 'Mestre', description: '400 pedidos', requiredOrders: 400, color: 'locked' },
  { id: '13', name: 'Lenda', description: '500 pedidos', requiredOrders: 500, color: 'locked' },
];

const milestones = [
  { orders: 0, icon: '🎀' },
  { orders: 1, number: 1 },
  { orders: 5, number: 5 },
  { orders: 10, number: 10 },
  { orders: 15, number: 15 },
  { orders: 20, number: 20 },
  { orders: 40, number: 40 },
  { orders: 80, number: 80 },
  { orders: 150, number: 150 },
  { orders: 200, number: 200 },
];

export const WaiterChallengesView = ({ onBack, waiterName, totalOrders = 15 }: WaiterChallengesViewProps) => {
  const getBadgeColor = (badge: Badge, isUnlocked: boolean) => {
    if (!isUnlocked) return 'locked';
    return badge.color;
  };

  const getBadgeStyles = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-gradient-to-b from-[#4a6fa5] to-[#2d4a7c]',
          border: 'border-[#6b8fc7]',
          innerBg: 'bg-gradient-to-b from-[#3a5f95] to-[#1d3a6c]',
        };
      case 'bronze':
        return {
          bg: 'bg-gradient-to-b from-[#cd7f32] to-[#8b4513]',
          border: 'border-[#daa06d]',
          innerBg: 'bg-gradient-to-b from-[#b87333] to-[#6b3503]',
        };
      case 'gold':
        return {
          bg: 'bg-gradient-to-b from-[#c9a227] to-[#8b6914]',
          border: 'border-[#d4af37]',
          innerBg: 'bg-gradient-to-b from-[#b89217] to-[#6b5904]',
        };
      default:
        return {
          bg: 'bg-gradient-to-b from-[#4a5568] to-[#2d3748]',
          border: 'border-[#5a6578]',
          innerBg: 'bg-gradient-to-b from-[#3a4558] to-[#1d2738]',
        };
    }
  };

  const getMilestoneStyles = (orders: number, currentOrders: number) => {
    if (currentOrders >= orders) {
      if (orders === 0) return 'bg-gradient-to-b from-[#4a6fa5] to-[#2d4a7c] border-[#6b8fc7]';
      if (orders <= 5) return 'bg-gradient-to-b from-[#cd7f32] to-[#8b4513] border-[#daa06d]';
      if (orders <= 15) return 'bg-gradient-to-b from-[#c9a227] to-[#8b6914] border-[#d4af37]';
      return 'bg-gradient-to-b from-[#4a6fa5] to-[#2d4a7c] border-[#6b8fc7]';
    }
    return 'bg-gradient-to-b from-[#4a5568] to-[#2d3748] border-[#5a6578]';
  };

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-4 flex items-center gap-4 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-lg">Desafios do Garçom</h1>
      </header>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Player Section */}
        <div>
          <p className="text-slate-400 text-sm mb-1">Jogador</p>
          <h2 className="text-white text-xl font-semibold">{waiterName}</h2>
          <p className="text-slate-400 text-sm mt-1">Total de pedidos: {totalOrders}</p>
        </div>

        {/* Progress Bar with Milestones */}
        <div>
          <div className="flex items-center justify-between mb-2 overflow-x-auto pb-2">
            {milestones.map((milestone, index) => (
              <div key={milestone.orders} className="flex flex-col items-center flex-shrink-0">
                <div 
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-white text-xs font-bold ${getMilestoneStyles(milestone.orders, totalOrders)}`}
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  {milestone.icon || milestone.number}
                </div>
                {index < milestones.length - 1 && (
                  <div className="hidden" />
                )}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm text-center mt-3">
            Realize pedidos para ganhar selos e subir de nível!
          </p>
        </div>

        {/* Meus desafios */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Meus desafios</h3>
          <div className="bg-[#0f2d4d] rounded-xl p-8 flex flex-col items-center justify-center">
            <Smile className="w-10 h-10 text-slate-500 mb-3" />
            <p className="text-white font-semibold text-center">Nenhum desafio pendente</p>
            <p className="text-slate-400 text-sm text-center mt-1">
              Fique de olho! Traremos novos desafios em breve
            </p>
          </div>
        </div>

        {/* Meus selos */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-2">Meus selos</h3>
          <p className="text-slate-400 text-sm mb-4">Conquistas</p>
          
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => {
              const isUnlocked = totalOrders >= badge.requiredOrders;
              const color = getBadgeColor(badge, isUnlocked);
              const styles = getBadgeStyles(color);
              
              return (
                <div key={badge.id} className="flex flex-col items-center">
                  {/* Hexagonal Badge */}
                  <div className="relative w-20 h-20 mb-2">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <defs>
                        <linearGradient id={`grad-${badge.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          {color === 'blue' && (
                            <>
                              <stop offset="0%" stopColor="#4a6fa5" />
                              <stop offset="100%" stopColor="#2d4a7c" />
                            </>
                          )}
                          {color === 'bronze' && (
                            <>
                              <stop offset="0%" stopColor="#cd7f32" />
                              <stop offset="100%" stopColor="#8b4513" />
                            </>
                          )}
                          {color === 'gold' && (
                            <>
                              <stop offset="0%" stopColor="#c9a227" />
                              <stop offset="100%" stopColor="#8b6914" />
                            </>
                          )}
                          {color === 'locked' && (
                            <>
                              <stop offset="0%" stopColor="#4a5568" />
                              <stop offset="100%" stopColor="#2d3748" />
                            </>
                          )}
                        </linearGradient>
                        <linearGradient id={`inner-${badge.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          {color === 'blue' && (
                            <>
                              <stop offset="0%" stopColor="#3a5f95" />
                              <stop offset="100%" stopColor="#1d3a6c" />
                            </>
                          )}
                          {color === 'bronze' && (
                            <>
                              <stop offset="0%" stopColor="#b87333" />
                              <stop offset="100%" stopColor="#6b3503" />
                            </>
                          )}
                          {color === 'gold' && (
                            <>
                              <stop offset="0%" stopColor="#b89217" />
                              <stop offset="100%" stopColor="#6b5904" />
                            </>
                          )}
                          {color === 'locked' && (
                            <>
                              <stop offset="0%" stopColor="#3a4558" />
                              <stop offset="100%" stopColor="#1d2738" />
                            </>
                          )}
                        </linearGradient>
                      </defs>
                      {/* Outer hexagon */}
                      <polygon 
                        points="50,2 93,25 93,75 50,98 7,75 7,25" 
                        fill={`url(#grad-${badge.id})`}
                        stroke={color === 'blue' ? '#6b8fc7' : color === 'bronze' ? '#daa06d' : color === 'gold' ? '#d4af37' : '#5a6578'}
                        strokeWidth="2"
                      />
                      {/* Inner hexagon */}
                      <polygon 
                        points="50,12 83,30 83,70 50,88 17,70 17,30" 
                        fill={`url(#inner-${badge.id})`}
                      />
                      {/* Badge content */}
                      <text 
                        x="50" 
                        y="55" 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize={badge.icon ? "24" : badge.requiredOrders >= 100 ? "18" : "22"}
                        fontWeight="bold"
                      >
                        {badge.icon || badge.requiredOrders}
                      </text>
                      {/* Small star decoration */}
                      {!badge.icon && (
                        <text x="50" y="72" textAnchor="middle" fill="white" fontSize="8">★</text>
                      )}
                    </svg>
                  </div>
                  <p className="text-white text-sm font-medium text-center">{badge.name}</p>
                  <p className="text-slate-400 text-xs text-center">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

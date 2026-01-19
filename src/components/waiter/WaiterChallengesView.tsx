import { ArrowLeft, Smile } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  color: 'blue' | 'bronze' | 'gold' | 'locked';
  isWelcome?: boolean;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
}

const badges: Badge[] = [
  { id: '1', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, color: 'blue', isWelcome: true },
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
  { orders: 0, isWelcome: true },
  { orders: 1 },
  { orders: 5 },
  { orders: 10 },
  { orders: 15 },
  { orders: 20 },
  { orders: 40 },
  { orders: 80 },
  { orders: 150 },
  { orders: 200 },
];

export const WaiterChallengesView = ({ onBack, waiterName, totalOrders = 15 }: WaiterChallengesViewProps) => {
  const getMilestoneColor = (orders: number, currentOrders: number) => {
    const isUnlocked = currentOrders >= orders;
    if (!isUnlocked) return { outer: '#3d4f6f', inner: '#2a3a52', border: '#4a5d7a' };
    
    if (orders === 0) return { outer: '#4a6fa5', inner: '#3a5a8c', border: '#6b8fc7' };
    if (orders <= 5) return { outer: '#cd7f32', inner: '#a66628', border: '#daa06d' };
    if (orders <= 15) return { outer: '#c9a227', inner: '#a68520', border: '#d4af37' };
    return { outer: '#3d4f6f', inner: '#2a3a52', border: '#4a5d7a' };
  };

  const getBadgeColors = (badge: Badge, isUnlocked: boolean) => {
    if (!isUnlocked) return { outer: '#3d4f6f', inner: '#2a3a52', border: '#4a5d7a' };
    
    switch (badge.color) {
      case 'blue':
        return { outer: '#4a6fa5', inner: '#3a5a8c', border: '#6b8fc7' };
      case 'bronze':
        return { outer: '#cd7f32', inner: '#a66628', border: '#daa06d' };
      case 'gold':
        return { outer: '#c9a227', inner: '#a68520', border: '#d4af37' };
      default:
        return { outer: '#3d4f6f', inner: '#2a3a52', border: '#4a5d7a' };
    }
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
        <div className="relative">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#2a3a52] -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-[#4a6fa5] via-[#cd7f32] to-[#c9a227] -translate-y-1/2 z-0"
              style={{ 
                width: `${Math.min((totalOrders / 200) * 100, 100)}%`,
              }}
            />
            
            {milestones.map((milestone) => {
              const colors = getMilestoneColor(milestone.orders, totalOrders);
              const isUnlocked = totalOrders >= milestone.orders;
              
              return (
                <div key={milestone.orders} className="relative z-10 flex-shrink-0">
                  <svg viewBox="0 0 40 46" className="w-8 h-9">
                    {/* Hexagon shape */}
                    <polygon 
                      points="20,1 38,12 38,34 20,45 2,34 2,12" 
                      fill={colors.outer}
                      stroke={colors.border}
                      strokeWidth="2"
                    />
                    <polygon 
                      points="20,6 33,14 33,32 20,40 7,32 7,14" 
                      fill={colors.inner}
                    />
                    {/* Content */}
                    {milestone.isWelcome ? (
                      <text x="20" y="26" textAnchor="middle" fill="white" fontSize="14">🎀</text>
                    ) : (
                      <text 
                        x="20" 
                        y={milestone.orders >= 100 ? "26" : "25"} 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize={milestone.orders >= 100 ? "9" : "12"}
                        fontWeight="bold"
                      >
                        {milestone.orders}
                      </text>
                    )}
                  </svg>
                </div>
              );
            })}
          </div>
          <p className="text-slate-400 text-sm text-center mt-4">
            Realize pedidos para ganhar selos e subir de nível!
          </p>
        </div>

        {/* Meus desafios */}
        <div>
          <h3 className="text-white font-semibold text-lg mb-4">Meus desafios</h3>
          <div className="bg-[#0f2d4d] rounded-xl p-8 flex flex-col items-center justify-center border border-[#1e4976]">
            <div className="w-12 h-12 rounded-full border-2 border-slate-500 flex items-center justify-center mb-3">
              <Smile className="w-6 h-6 text-slate-500" />
            </div>
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
          
          <div className="grid grid-cols-3 gap-6">
            {badges.map((badge) => {
              const isUnlocked = totalOrders >= badge.requiredOrders;
              const colors = getBadgeColors(badge, isUnlocked);
              
              return (
                <div key={badge.id} className="flex flex-col items-center">
                  {/* Hexagonal Badge */}
                  <div className="relative w-20 h-24 mb-2">
                    <svg viewBox="0 0 80 92" className="w-full h-full">
                      {/* Outer hexagon */}
                      <polygon 
                        points="40,2 76,22 76,70 40,90 4,70 4,22" 
                        fill={colors.outer}
                        stroke={colors.border}
                        strokeWidth="3"
                      />
                      {/* Inner hexagon */}
                      <polygon 
                        points="40,12 66,28 66,64 40,80 14,64 14,28" 
                        fill={colors.inner}
                      />
                      {/* Badge content */}
                      {badge.isWelcome ? (
                        <text x="40" y="50" textAnchor="middle" fill="white" fontSize="28">🎀</text>
                      ) : (
                        <>
                          <text 
                            x="40" 
                            y={badge.requiredOrders >= 100 ? "50" : "48"} 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize={badge.requiredOrders >= 100 ? "20" : "26"}
                            fontWeight="bold"
                          >
                            {badge.requiredOrders}
                          </text>
                          <text x="40" y="68" textAnchor="middle" fill="white" fontSize="10">★</text>
                        </>
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

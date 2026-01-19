import { ArrowLeft, Smile } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  colorType: 'pink' | 'blue' | 'bronze' | 'gold' | 'locked';
  isWelcome?: boolean;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
}

const badges: Badge[] = [
  { id: '1', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, colorType: 'pink', isWelcome: true },
  { id: '2', name: 'Iniciante', description: 'primeiro pedido', requiredOrders: 1, colorType: 'blue' },
  { id: '3', name: 'Aprendiz', description: '5 pedidos', requiredOrders: 5, colorType: 'bronze' },
  { id: '4', name: 'Profissional', description: '10 pedidos', requiredOrders: 10, colorType: 'blue' },
  { id: '5', name: 'Avançado', description: '15 pedidos', requiredOrders: 15, colorType: 'gold' },
  { id: '6', name: 'Sênior', description: '20 pedidos', requiredOrders: 20, colorType: 'gold' },
  { id: '7', name: 'Veterano', description: '40 pedidos', requiredOrders: 40, colorType: 'locked' },
  { id: '8', name: 'Exemplar', description: '80 pedidos', requiredOrders: 80, colorType: 'locked' },
  { id: '9', name: 'Especialista', description: '150 pedidos', requiredOrders: 150, colorType: 'locked' },
  { id: '10', name: 'Maestro', description: '200 pedidos', requiredOrders: 200, colorType: 'locked' },
  { id: '11', name: 'Guru', description: '300 pedidos', requiredOrders: 300, colorType: 'locked' },
  { id: '12', name: 'Mestre', description: '400 pedidos', requiredOrders: 400, colorType: 'locked' },
  { id: '13', name: 'Lenda', description: '500 pedidos', requiredOrders: 500, colorType: 'locked' },
];

const milestones = [
  { orders: 0, isWelcome: true, colorType: 'pink' as const },
  { orders: 1, colorType: 'blue' as const },
  { orders: 5, colorType: 'bronze' as const },
  { orders: 10, colorType: 'blue' as const },
  { orders: 15, colorType: 'gold' as const },
  { orders: 20, colorType: 'gold' as const },
  { orders: 40, colorType: 'locked' as const },
  { orders: 80, colorType: 'locked' as const },
  { orders: 150, colorType: 'locked' as const },
  { orders: 200, colorType: 'locked' as const },
];

const getColorsByType = (colorType: string, isUnlocked: boolean) => {
  if (!isUnlocked) {
    return { 
      outer: '#3d4f6f', 
      inner: '#2a3a52', 
      border: '#4a5d7a',
      gradient1: '#3d4f6f',
      gradient2: '#2a3a52'
    };
  }
  
  switch (colorType) {
    case 'pink':
      return { 
        outer: '#e75480', 
        inner: '#c9446c', 
        border: '#f06292',
        gradient1: '#f06292',
        gradient2: '#c9446c'
      };
    case 'blue':
      return { 
        outer: '#4a7fc7', 
        inner: '#3a6499', 
        border: '#6b9fd7',
        gradient1: '#5a8fd7',
        gradient2: '#3a5a8c'
      };
    case 'bronze':
      return { 
        outer: '#cd7f32', 
        inner: '#a66628', 
        border: '#daa06d',
        gradient1: '#d4943d',
        gradient2: '#8a5420'
      };
    case 'gold':
      return { 
        outer: '#c9a227', 
        inner: '#a68520', 
        border: '#d4b847',
        gradient1: '#d4b837',
        gradient2: '#8a7018'
      };
    default:
      return { 
        outer: '#3d4f6f', 
        inner: '#2a3a52', 
        border: '#4a5d7a',
        gradient1: '#3d4f6f',
        gradient2: '#2a3a52'
      };
  }
};

export const WaiterChallengesView = ({ onBack, waiterName, totalOrders = 15 }: WaiterChallengesViewProps) => {
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
            {/* Connection line background */}
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#2a3a52] -translate-y-1/2 z-0" />
            
            {milestones.map((milestone) => {
              const isUnlocked = totalOrders >= milestone.orders;
              const colors = getColorsByType(milestone.colorType, isUnlocked);
              
              return (
                <div key={milestone.orders} className="relative z-10 flex-shrink-0">
                  <svg viewBox="0 0 40 46" className="w-8 h-9">
                    <defs>
                      <linearGradient id={`milestone-grad-${milestone.orders}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colors.gradient1} />
                        <stop offset="100%" stopColor={colors.gradient2} />
                      </linearGradient>
                    </defs>
                    {/* Hexagon shape */}
                    <polygon 
                      points="20,1 38,12 38,34 20,45 2,34 2,12" 
                      fill={`url(#milestone-grad-${milestone.orders})`}
                      stroke={colors.border}
                      strokeWidth="1.5"
                    />
                    {/* Inner hexagon for depth */}
                    <polygon 
                      points="20,5 34,14 34,32 20,41 6,32 6,14" 
                      fill={colors.inner}
                      opacity="0.6"
                    />
                    {/* Content */}
                    {milestone.isWelcome ? (
                      <g transform="translate(20, 23)">
                        <path 
                          d="M-6,-3 Q-6,-6 -3,-6 Q0,-6 0,-3 Q0,-6 3,-6 Q6,-6 6,-3 Q6,0 0,5 Q-6,0 -6,-3 Z" 
                          fill="#fff"
                          opacity="0.9"
                        />
                        <ellipse cx="-4" cy="-2" rx="3" ry="2" fill="#fff" />
                        <ellipse cx="4" cy="-2" rx="3" ry="2" fill="#fff" />
                      </g>
                    ) : (
                      <text 
                        x="20" 
                        y={milestone.orders >= 100 ? "26" : "26"} 
                        textAnchor="middle" 
                        fill="white" 
                        fontSize={milestone.orders >= 100 ? "9" : "11"}
                        fontWeight="bold"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
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
          
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => {
              const isUnlocked = totalOrders >= badge.requiredOrders;
              const colors = getColorsByType(badge.colorType, isUnlocked);
              
              return (
                <div key={badge.id} className="flex flex-col items-center">
                  {/* Hexagonal Badge */}
                  <div className="relative w-20 h-24 mb-2">
                    <svg viewBox="0 0 80 92" className="w-full h-full drop-shadow-lg">
                      <defs>
                        <linearGradient id={`badge-grad-${badge.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={colors.gradient1} />
                          <stop offset="100%" stopColor={colors.gradient2} />
                        </linearGradient>
                        <filter id={`badge-shadow-${badge.id}`}>
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      {/* Outer hexagon */}
                      <polygon 
                        points="40,2 76,22 76,70 40,90 4,70 4,22" 
                        fill={`url(#badge-grad-${badge.id})`}
                        stroke={colors.border}
                        strokeWidth="2"
                        filter={`url(#badge-shadow-${badge.id})`}
                      />
                      {/* Inner hexagon for depth */}
                      <polygon 
                        points="40,10 68,26 68,66 40,82 12,66 12,26" 
                        fill={colors.inner}
                        opacity="0.5"
                      />
                      {/* Badge content */}
                      {badge.isWelcome ? (
                        <g transform="translate(40, 46)">
                          {/* Ribbon/bow icon */}
                          <ellipse cx="-10" cy="-6" rx="10" ry="8" fill="#fff" opacity="0.95"/>
                          <ellipse cx="10" cy="-6" rx="10" ry="8" fill="#fff" opacity="0.95"/>
                          <circle cx="0" cy="-4" r="6" fill="#fff"/>
                          <path d="M-4,2 L0,18 L4,2 Z" fill="#fff" opacity="0.95"/>
                          <path d="M-8,0 L-12,16 L-4,4 Z" fill="#fff" opacity="0.9"/>
                          <path d="M8,0 L12,16 L4,4 Z" fill="#fff" opacity="0.9"/>
                        </g>
                      ) : (
                        <>
                          <text 
                            x="40" 
                            y={badge.requiredOrders >= 100 ? "50" : "48"} 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize={badge.requiredOrders >= 100 ? "22" : "28"}
                            fontWeight="bold"
                            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}
                          >
                            {badge.requiredOrders}
                          </text>
                          <text 
                            x="40" 
                            y="68" 
                            textAnchor="middle" 
                            fill="white" 
                            fontSize="14"
                            opacity="0.9"
                          >
                            ★
                          </text>
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

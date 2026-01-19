import { ArrowLeft, Smile } from 'lucide-react';

// Import badge images
import badge1 from '@/assets/badges/badge-1.png';
import badge5 from '@/assets/badges/badge-5.png';
import badge10 from '@/assets/badges/badge-10.png';
import badge15 from '@/assets/badges/badge-15.png';
import badge20 from '@/assets/badges/badge-20.png';
import badge40 from '@/assets/badges/badge-40.png';
import badge80 from '@/assets/badges/badge-80.png';
import badge150 from '@/assets/badges/badge-150.png';
import badge200 from '@/assets/badges/badge-200.png';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  image: string;
  isWelcome?: boolean;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
}

const badges: Badge[] = [
  { id: '1', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, image: '', isWelcome: true },
  { id: '2', name: 'Iniciante', description: 'primeiro pedido', requiredOrders: 1, image: badge1 },
  { id: '3', name: 'Aprendiz', description: '5 pedidos', requiredOrders: 5, image: badge5 },
  { id: '4', name: 'Profissional', description: '10 pedidos', requiredOrders: 10, image: badge10 },
  { id: '5', name: 'Avançado', description: '15 pedidos', requiredOrders: 15, image: badge15 },
  { id: '6', name: 'Sênior', description: '20 pedidos', requiredOrders: 20, image: badge20 },
  { id: '7', name: 'Veterano', description: '40 pedidos', requiredOrders: 40, image: badge40 },
  { id: '8', name: 'Exemplar', description: '80 pedidos', requiredOrders: 80, image: badge80 },
  { id: '9', name: 'Especialista', description: '150 pedidos', requiredOrders: 150, image: badge150 },
  { id: '10', name: 'Maestro', description: '200 pedidos', requiredOrders: 200, image: badge200 },
];

const milestones = [
  { orders: 0, isWelcome: true, image: '' },
  { orders: 1, image: badge1 },
  { orders: 5, image: badge5 },
  { orders: 10, image: badge10 },
  { orders: 15, image: badge15 },
  { orders: 20, image: badge20 },
  { orders: 40, image: badge40 },
  { orders: 80, image: badge80 },
  { orders: 150, image: badge150 },
  { orders: 200, image: badge200 },
];

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
              
              return (
                <div key={milestone.orders} className="relative z-10 flex-shrink-0">
                  {milestone.isWelcome ? (
                    // Welcome badge (pink ribbon)
                    <div className={`w-8 h-9 flex items-center justify-center ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
                      <svg viewBox="0 0 40 46" className="w-full h-full">
                        <defs>
                          <linearGradient id="welcome-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f06292" />
                            <stop offset="100%" stopColor="#c9446c" />
                          </linearGradient>
                        </defs>
                        <polygon 
                          points="20,1 38,12 38,34 20,45 2,34 2,12" 
                          fill="url(#welcome-grad)"
                          stroke="#f06292"
                          strokeWidth="1.5"
                        />
                        <g transform="translate(20, 23)">
                          <ellipse cx="-5" cy="-3" rx="5" ry="4" fill="#fff" opacity="0.95"/>
                          <ellipse cx="5" cy="-3" rx="5" ry="4" fill="#fff" opacity="0.95"/>
                          <circle cx="0" cy="-2" r="3" fill="#fff"/>
                          <path d="M-2,1 L0,9 L2,1 Z" fill="#fff" opacity="0.95"/>
                          <path d="M-4,0 L-6,8 L-2,2 Z" fill="#fff" opacity="0.9"/>
                          <path d="M4,0 L6,8 L2,2 Z" fill="#fff" opacity="0.9"/>
                        </g>
                      </svg>
                    </div>
                  ) : (
                    <img 
                      src={milestone.image} 
                      alt={`${milestone.orders} pedidos`}
                      className={`w-8 h-9 object-contain ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                    />
                  )}
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
              
              return (
                <div key={badge.id} className="flex flex-col items-center">
                  {/* Badge Image */}
                  <div className="relative w-20 h-24 mb-2 flex items-center justify-center">
                    {badge.isWelcome ? (
                      // Welcome badge (pink ribbon) - larger version
                      <svg viewBox="0 0 80 92" className={`w-full h-full drop-shadow-lg ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}>
                        <defs>
                          <linearGradient id="welcome-badge-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f06292" />
                            <stop offset="100%" stopColor="#c9446c" />
                          </linearGradient>
                        </defs>
                        <polygon 
                          points="40,2 76,22 76,70 40,90 4,70 4,22" 
                          fill="url(#welcome-badge-grad)"
                          stroke="#f06292"
                          strokeWidth="2"
                        />
                        <g transform="translate(40, 46)">
                          <ellipse cx="-10" cy="-6" rx="10" ry="8" fill="#fff" opacity="0.95"/>
                          <ellipse cx="10" cy="-6" rx="10" ry="8" fill="#fff" opacity="0.95"/>
                          <circle cx="0" cy="-4" r="6" fill="#fff"/>
                          <path d="M-4,2 L0,18 L4,2 Z" fill="#fff" opacity="0.95"/>
                          <path d="M-8,0 L-12,16 L-4,4 Z" fill="#fff" opacity="0.9"/>
                          <path d="M8,0 L12,16 L4,4 Z" fill="#fff" opacity="0.9"/>
                        </g>
                      </svg>
                    ) : (
                      <img 
                        src={badge.image} 
                        alt={badge.name}
                        className={`w-full h-full object-contain drop-shadow-lg ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                      />
                    )}
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

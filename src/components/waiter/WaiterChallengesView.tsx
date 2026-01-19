import { ArrowLeft, Smile } from 'lucide-react';


// Import badge images
import badgeWelcome from '@/assets/badges/badge-welcome.png';
import badge1 from '@/assets/badges/badge-1.png';
import badge5 from '@/assets/badges/badge-5.png';
import badge10 from '@/assets/badges/badge-10.png';
import badge15 from '@/assets/badges/badge-15.png';
import badge20 from '@/assets/badges/badge-20.png';
import badge40 from '@/assets/badges/badge-40.png';
import badge80 from '@/assets/badges/badge-80.png';
import badge150 from '@/assets/badges/badge-150.png';
import badge200 from '@/assets/badges/badge-200.png';
import badge300 from '@/assets/badges/badge-300.png';
import badge400 from '@/assets/badges/badge-400.png';
import badge500 from '@/assets/badges/badge-500.png';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  image: string;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
  isLoading?: boolean;
}

const badges: Badge[] = [
  { id: '0', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, image: badgeWelcome },
  { id: '1', name: 'Iniciante', description: 'primeiro pedido', requiredOrders: 1, image: badge1 },
  { id: '2', name: 'Aprendiz', description: '5 pedidos', requiredOrders: 5, image: badge5 },
  { id: '3', name: 'Profissional', description: '10 pedidos', requiredOrders: 10, image: badge10 },
  { id: '4', name: 'Avançado', description: '15 pedidos', requiredOrders: 15, image: badge15 },
  { id: '5', name: 'Sênior', description: '20 pedidos', requiredOrders: 20, image: badge20 },
  { id: '6', name: 'Veterano', description: '40 pedidos', requiredOrders: 40, image: badge40 },
  { id: '7', name: 'Exemplar', description: '80 pedidos', requiredOrders: 80, image: badge80 },
  { id: '8', name: 'Especialista', description: '150 pedidos', requiredOrders: 150, image: badge150 },
  { id: '9', name: 'Maestro', description: '200 pedidos', requiredOrders: 200, image: badge200 },
  { id: '10', name: 'Guru', description: '300 pedidos', requiredOrders: 300, image: badge300 },
  { id: '11', name: 'Mestre', description: '400 pedidos', requiredOrders: 400, image: badge400 },
  { id: '12', name: 'Lenda', description: '500 pedidos', requiredOrders: 500, image: badge500 },
];

// Only show first 5 milestones in progress bar for cleaner look
const progressMilestones = [
  { orders: 0, image: badgeWelcome },
  { orders: 1, image: badge1 },
  { orders: 5, image: badge5 },
  { orders: 10, image: badge10 },
  { orders: 15, image: badge15 },
];

export const WaiterChallengesView = ({ 
  onBack, 
  waiterName, 
  totalOrders = 0,
  isLoading = false 
}: WaiterChallengesViewProps) => {
  // Calculate progress percentage based on visible milestones
  const maxMilestone = progressMilestones[progressMilestones.length - 1].orders;
  const progressPercent = Math.min((totalOrders / maxMilestone) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col relative overflow-hidden">

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
          <h2 className="text-white text-xl font-bold">{waiterName}</h2>
          <p className="text-slate-400 text-sm mt-1">
            Total de pedidos: {isLoading ? (
              <span className="inline-block w-8 h-4 bg-slate-700 rounded animate-pulse" />
            ) : totalOrders}
          </p>
        </div>

        {/* Progress Bar with Milestones */}
        <div className="relative py-2">
          <div className="flex items-center justify-between relative">
            {/* Connection line background */}
            <div className="absolute top-1/2 left-6 right-6 h-1 bg-[#1e3a5f] -translate-y-1/2 z-0 rounded-full" />
            {/* Progress line */}
            <div 
              className="absolute top-1/2 left-6 h-1 bg-gradient-to-r from-blue-500 via-amber-500 to-amber-400 -translate-y-1/2 z-0 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercent}% - 24px)` }}
            />
            
            {progressMilestones.map((milestone, index) => {
              const isUnlocked = totalOrders >= milestone.orders;
              const isActive = totalOrders >= milestone.orders && 
                (index === progressMilestones.length - 1 || totalOrders < progressMilestones[index + 1]?.orders);
              
              return (
                <div 
                  key={milestone.orders} 
                  className={`relative z-10 flex-shrink-0 transition-all duration-500 ${isActive ? 'scale-125' : ''}`}
                >
                  <img 
                    src={milestone.image} 
                    alt={`${milestone.orders} pedidos`}
                    className="w-12 h-14 object-contain transition-all duration-500"
                    style={!isUnlocked 
                      ? { filter: 'grayscale(100%) brightness(0.35) sepia(100%) hue-rotate(180deg) saturate(400%)', opacity: 0.6 } 
                      : { filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }
                    }
                  />
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
          <h3 className="text-white font-bold text-lg mb-4">Meus desafios</h3>
          <div className="bg-[#0f2d4d] rounded-xl p-8 flex flex-col items-center justify-center border border-[#1e4976]">
            <div className="w-14 h-14 rounded-full border-2 border-slate-500/50 flex items-center justify-center mb-4">
              <Smile className="w-7 h-7 text-slate-500" />
            </div>
            <p className="text-white font-semibold text-center text-lg">Nenhum desafio pendente</p>
            <p className="text-slate-400 text-sm text-center mt-2">
              Fique de olho! Traremos novos desafios em breve
            </p>
          </div>
        </div>

        {/* Meus selos */}
        <div>
          <h3 className="text-white font-bold text-lg mb-2">Meus selos</h3>
          <p className="text-slate-400 text-sm mb-4">Conquistas</p>
          
          <div className="grid grid-cols-3 gap-4">
            {badges.map((badge) => {
              const isUnlocked = totalOrders >= badge.requiredOrders;
              
              return (
                <div 
                  key={badge.id} 
                  className={`flex flex-col items-center transition-all duration-300 ${
                    isUnlocked ? 'hover:scale-105' : ''
                  }`}
                >
                  {/* Badge Image */}
                  <div className="relative w-24 h-28 mb-2 flex items-center justify-center">
                    <img 
                      src={badge.image} 
                      alt={badge.name}
                      className="w-full h-full object-contain transition-all duration-300"
                      style={!isUnlocked 
                        ? { filter: 'grayscale(100%) brightness(0.35) sepia(100%) hue-rotate(180deg) saturate(400%)', opacity: 0.6 } 
                        : { filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))' }
                      }
                    />
                  </div>
                  <p className={`text-sm font-semibold text-center transition-colors duration-300 ${
                    isUnlocked ? 'text-white' : 'text-slate-400'
                  }`}>
                    {badge.name}
                  </p>
                  <p className={`text-xs text-center transition-colors duration-300 ${
                    isUnlocked ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    {badge.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

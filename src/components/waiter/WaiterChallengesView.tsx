import { ArrowLeft, Smile } from 'lucide-react';


// Import badge images - unlocked
import badgeWelcome from '@/assets/badges/badge-welcome.png';
import badge1 from '@/assets/badges/badge-1-new.png';
import badge5 from '@/assets/badges/badge-5-new.png';
import badge10 from '@/assets/badges/badge-10-new.png';
import badge15 from '@/assets/badges/badge-15-new.png';
import badge20 from '@/assets/badges/badge-20-new.png';
import badge40 from '@/assets/badges/badge-40-new.png';
import badge80 from '@/assets/badges/badge-80-new.png';
import badge150 from '@/assets/badges/badge-150-new.png';
import badge200 from '@/assets/badges/badge-200-new.png';
import badge300 from '@/assets/badges/badge-300-new.png';
import badge400 from '@/assets/badges/badge-400-new.png';

// Import badge images - locked versions
import badge1Locked from '@/assets/badges/badge-1-locked.png';
import badge5Locked from '@/assets/badges/badge-5-locked.png';
import badge10Locked from '@/assets/badges/badge-10-locked.png';
import badge15Locked from '@/assets/badges/badge-15-locked.png';
import badge20Locked from '@/assets/badges/badge-20-locked.png';
import badge40Locked from '@/assets/badges/badge-40-locked.png';
import badge80Locked from '@/assets/badges/badge-80-locked.png';
import badge150Locked from '@/assets/badges/badge-150-locked.png';
import badge200Locked from '@/assets/badges/badge-200-locked.png';
import badge300Locked from '@/assets/badges/badge-300-locked.png';
import badge400Locked from '@/assets/badges/badge-400-locked.png';

interface Badge {
  id: string;
  name: string;
  description: string;
  requiredOrders: number;
  image: string;
  lockedImage?: string;
}

interface WaiterChallengesViewProps {
  onBack: () => void;
  waiterName: string;
  totalOrders?: number;
  isLoading?: boolean;
}

const badges: Badge[] = [
  { id: '0', name: 'Bem-vindo', description: 'entrou no app', requiredOrders: 0, image: badgeWelcome },
  { id: '1', name: 'Iniciante', description: 'primeiro pedido', requiredOrders: 1, image: badge1, lockedImage: badge1Locked },
  { id: '2', name: 'Aprendiz', description: '5 pedidos', requiredOrders: 5, image: badge5, lockedImage: badge5Locked },
  { id: '3', name: 'Profissional', description: '10 pedidos', requiredOrders: 10, image: badge10, lockedImage: badge10Locked },
  { id: '4', name: 'Avançado', description: '15 pedidos', requiredOrders: 15, image: badge15, lockedImage: badge15Locked },
  { id: '5', name: 'Sênior', description: '20 pedidos', requiredOrders: 20, image: badge20, lockedImage: badge20Locked },
  { id: '6', name: 'Veterano', description: '40 pedidos', requiredOrders: 40, image: badge40, lockedImage: badge40Locked },
  { id: '7', name: 'Exemplar', description: '80 pedidos', requiredOrders: 80, image: badge80, lockedImage: badge80Locked },
  { id: '8', name: 'Especialista', description: '150 pedidos', requiredOrders: 150, image: badge150, lockedImage: badge150Locked },
  { id: '9', name: 'Maestro', description: '200 pedidos', requiredOrders: 200, image: badge200, lockedImage: badge200Locked },
  { id: '10', name: 'Guru', description: '300 pedidos', requiredOrders: 300, image: badge300, lockedImage: badge300Locked },
  { id: '11', name: 'Lenda', description: '400 pedidos', requiredOrders: 400, image: badge400, lockedImage: badge400Locked },
];

// All milestones for the progress bar
const allMilestones = [
  { orders: 0, image: badgeWelcome, lockedImage: badgeWelcome },
  { orders: 1, image: badge1, lockedImage: badge1Locked },
  { orders: 5, image: badge5, lockedImage: badge5Locked },
  { orders: 10, image: badge10, lockedImage: badge10Locked },
  { orders: 15, image: badge15, lockedImage: badge15Locked },
  { orders: 20, image: badge20, lockedImage: badge20Locked },
  { orders: 40, image: badge40, lockedImage: badge40Locked },
  { orders: 80, image: badge80, lockedImage: badge80Locked },
  { orders: 150, image: badge150, lockedImage: badge150Locked },
  { orders: 200, image: badge200, lockedImage: badge200Locked },
  { orders: 300, image: badge300, lockedImage: badge300Locked },
  { orders: 400, image: badge400, lockedImage: badge400Locked },
];

// Get visible milestones based on current progress - shows 5 milestones that slide as you unlock
const getVisibleMilestones = (orders: number) => {
  // Find the index of the current milestone (last unlocked)
  let currentIndex = 0;
  for (let i = 0; i < allMilestones.length; i++) {
    if (orders >= allMilestones[i].orders) {
      currentIndex = i;
    } else {
      break;
    }
  }
  
  // Calculate start index - show current milestone and more ahead (when possible)
  let startIndex = currentIndex;
  
  // Make sure we show 5 milestones, adjust if near the end
  const visibleCount = 5;
  const maxStartIndex = Math.max(0, allMilestones.length - visibleCount);
  startIndex = Math.min(startIndex, maxStartIndex);
  
  return allMilestones.slice(startIndex, startIndex + visibleCount);
};

export const WaiterChallengesView = ({ 
  onBack, 
  waiterName, 
  totalOrders = 0,
  isLoading = false 
}: WaiterChallengesViewProps) => {
  // Get visible milestones based on current progress
  const visibleMilestones = getVisibleMilestones(totalOrders);
  
  // Calculate progress percentage based on visible milestones
  const firstMilestone = visibleMilestones[0].orders;
  const lastMilestone = visibleMilestones[visibleMilestones.length - 1].orders;
  const range = lastMilestone - firstMilestone;
  const progressInRange = Math.max(0, totalOrders - firstMilestone);
  const progressPercent = range > 0 ? Math.min((progressInRange / range) * 100, 100) : 100;

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col relative overflow-hidden">

      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-semibold text-lg">Desafios do Garçom</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Player Section with Progress Bar */}
        <div className="bg-[#0a1f38] px-4 py-3 space-y-3">
          <div>
            <p className="text-slate-400 text-sm mb-1">Jogador</p>
            <h2 className="text-white text-xl font-bold">{waiterName}</h2>
            <p className="text-slate-400 text-sm mt-1">
              Total de pedidos: {isLoading ? (
                <span className="inline-block w-8 h-4 bg-slate-700 rounded animate-pulse" />
              ) : totalOrders}
            </p>
          </div>

          {/* Progress Bar with Dynamic Milestones */}
          <div className="relative py-2">
            <div className="flex items-center justify-between relative">
              {/* Connection line background */}
              <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-[#1e3a5f] -translate-y-1/2 z-0" />
              {/* Progress line */}
              <div 
                className="absolute top-1/2 left-6 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 -translate-y-1/2 z-0 transition-all duration-1000 ease-out"
                style={{ width: `calc(${progressPercent}% - 24px)` }}
              />
              
              {visibleMilestones.map((milestone, index) => {
                const isUnlocked = totalOrders >= milestone.orders;
                const isActive = totalOrders >= milestone.orders && 
                  (index === visibleMilestones.length - 1 || totalOrders < visibleMilestones[index + 1]?.orders);
                
                return (
                  <div 
                    key={milestone.orders} 
                    className={`relative z-10 flex-shrink-0 transition-all duration-500 ${isActive ? 'scale-110' : ''}`}
                  >
                    <img 
                      src={isUnlocked ? milestone.image : milestone.lockedImage} 
                      alt={`${milestone.orders} pedidos`}
                      className="w-12 h-14 object-contain transition-all duration-500"
                      style={isUnlocked 
                        ? { filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }
                        : {}
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          <p className="text-slate-400 text-sm">
            Realize pedidos para ganhar selos e subir de nível!
          </p>
        </div>

        {/* Meus desafios - Section Header */}
        <div className="bg-[#0f2540] px-4 py-3 border-t border-b border-[#1e4976]">
          <h3 className="text-white font-bold text-lg">Meus desafios</h3>
        </div>

        {/* Meus desafios - Content */}
        <div className="bg-[#0d2847] p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-slate-500/50 flex items-center justify-center mb-4">
            <Smile className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-white font-semibold text-center text-lg">Nenhum desafio pendente</p>
          <p className="text-slate-400 text-sm text-center mt-2">
            Fique de olho! Traremos novos desafios em breve
          </p>
        </div>

        {/* Meus selos - Section Header */}
        <div className="bg-[#0f2540] px-4 py-3 border-t border-[#1e4976]">
          <h3 className="text-white font-bold text-lg">Meus selos</h3>
        </div>

        {/* Conquistas - Sub Header */}
        <div className="bg-[#0a1f38] px-4 py-3 border-b border-[#1e4976]">
          <p className="text-slate-300 font-semibold">Conquistas</p>
        </div>

        {/* Badges Grid */}
        <div className="bg-[#0d2847] p-4">
          <div className="grid grid-cols-3 gap-6">
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
                  <div className="relative w-20 h-24 mb-3 flex items-center justify-center">
                    <img 
                      src={isUnlocked ? badge.image : (badge.lockedImage || badge.image)} 
                      alt={badge.name}
                      className="w-full h-full object-contain transition-all duration-300"
                      style={!isUnlocked && !badge.lockedImage 
                        ? { filter: 'grayscale(1) brightness(0.3) contrast(0.8)', opacity: 0.5 } 
                        : {}
                      }
                    />
                  </div>
                  <p className={`text-base font-bold text-center leading-tight transition-colors duration-300 ${
                    isUnlocked ? 'text-white' : 'text-slate-300'
                  }`}>
                    {badge.name}
                  </p>
                  <p className={`text-sm text-center mt-1 transition-colors duration-300 ${
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

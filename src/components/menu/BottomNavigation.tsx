import { useNavigate, useParams } from 'react-router-dom';
import { Home, ClipboardList } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'home' | 'orders';
  hidden?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  hidden = false,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'home' as const,
      label: 'Início',
      icon: Home,
      onClick: () => navigate(`/r/${slug}`),
    },
    {
      id: 'orders' as const,
      label: 'Pedidos',
      icon: ClipboardList,
      onClick: () => navigate(`/r/${slug}/pedidos`),
    },
  ];

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 pb-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`flex flex-col items-center gap-0.5 px-6 py-1 relative ${
                isActive ? 'text-blue-500' : 'text-muted-foreground'
              }`}
            >
              {/* Active indicator line */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
              )}
              
              <div className="relative">
                <Icon className="w-5 h-5" />
              </div>
              
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

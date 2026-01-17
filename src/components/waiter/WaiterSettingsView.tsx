import { ArrowLeft, Search, Volume2, VolumeX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWaiterSettingsContext } from '@/contexts/WaiterSettingsContext';

interface WaiterSettingsViewProps {
  onBack: () => void;
  restaurantName?: string;
}

type SettingsTab = 'navegacao' | 'fotos' | 'descricoes' | 'esgotados' | 'precos' | 'tela_inicial' | 'som';

export const WaiterSettingsView = ({ onBack, restaurantName }: WaiterSettingsViewProps) => {
  const { settings, updateSettings } = useWaiterSettingsContext();
  const [activeTab, setActiveTab] = useState<SettingsTab>('navegacao');
  
  // Use settings from context
  const navegacao = settings.navegacao;
  const fotos = settings.fotos;
  const descricoes = settings.descricoes;
  const esgotados = settings.esgotados;
  const precos = settings.precos;
  const telaInicial = settings.telaInicial;
  const somNotificacao = settings.somNotificacao;

  const setNavegacao = (value: 'itens' | 'categorias') => updateSettings({ navegacao: value });
  const setFotos = (value: 'exibir' | 'nao_exibir') => updateSettings({ fotos: value });
  const setDescricoes = (value: 'exibir' | 'nao_exibir') => updateSettings({ descricoes: value });
  const setEsgotados = (value: 'exibir' | 'nao_exibir') => updateSettings({ esgotados: value });
  const setPrecos = (value: 'exibir' | 'nao_exibir') => updateSettings({ precos: value });
  const setTelaInicial = (value: 'mesas' | 'comandas') => updateSettings({ telaInicial: value });
  const setSomNotificacao = (value: 'ativado' | 'desativado') => updateSettings({ somNotificacao: value });

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'navegacao', label: 'Navegação' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'descricoes', label: 'Descrições' },
    { id: 'esgotados', label: 'Esgotados' },
    { id: 'precos', label: 'Preços' },
    { id: 'tela_inicial', label: 'Tela inicial' },
    { id: 'som', label: 'Som' },
  ];

  const handleSave = () => {
    toast.success('Configurações salvas com sucesso!');
    onBack();
  };

  const RadioOption = ({ 
    selected, 
    onSelect, 
    label 
  }: { 
    selected: boolean; 
    onSelect: () => void; 
    label: string;
  }) => (
    <button 
      onClick={onSelect}
      className="flex items-center gap-3 w-full py-2"
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'
      }`}>
        {selected && <div className="w-2 h-2 rounded-full bg-[#0a1628]" />}
      </div>
      <span className="text-white text-sm">{label}</span>
    </button>
  );

  // Phone mockup component
  const PhoneMockup = ({
    children,
    isSelected,
    onClick,
  }: {
    children: React.ReactNode;
    isSelected: boolean;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`w-[calc(50%-8px)] max-w-[256px] aspect-[9/16] flex-shrink-0 bg-[#0d2847] rounded-lg border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
        isSelected ? 'border-cyan-400' : 'border-[#1e4976]'
      }`}
    >
      <div className="w-full h-full overflow-hidden">
        {children}
      </div>
    </div>
  );

  // Phone header component
  const PhoneHeader = ({ title = "Mesa 4" }: { title?: string }) => (
    <div className="px-2 py-1.5 flex items-center justify-between bg-[#0d2847]">
      <div className="flex items-center gap-1.5">
        <ArrowLeft className="w-3 h-3 text-white" />
        <span className="text-white text-[10px] sm:text-xs font-medium">{title}</span>
      </div>
      <Search className="w-3 h-3 text-slate-400" />
    </div>
  );

  // Pizza image placeholder
  const PizzaImage = ({ small = false }: { small?: boolean }) => (
    <div className={`${small ? 'w-6 h-6' : 'w-7 h-7 sm:w-8 sm:h-8'} rounded-md bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0`}>
      <span className={small ? 'text-xs' : 'text-sm sm:text-base'}>🍕</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col">
      {/* Header */}
      <header className="bg-[#0a1628] px-4 py-4 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="text-white hover:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-white font-medium text-lg">Configurações</h1>
      </header>

      {/* Tabs */}
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'bg-[#0a1628] text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-24 overflow-y-auto">
        {activeTab === 'navegacao' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Modo de navegação do cardápio:</h3>
              <RadioOption
                selected={navegacao === 'itens'}
                onSelect={() => setNavegacao('itens')}
                label="Iniciar pelos itens"
              />
              <RadioOption
                selected={navegacao === 'categorias'}
                onSelect={() => setNavegacao('categorias')}
                label="Iniciar pela categoria"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Items view mockup - Mostra produtos direto */}
              <PhoneMockup isSelected={navegacao === 'itens'} onClick={() => setNavegacao('itens')}>
                <PhoneHeader />
                {/* Category tabs */}
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium whitespace-nowrap">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px] whitespace-nowrap">Cat 2</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px] whitespace-nowrap">Cat 3</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  
                  {/* Product items */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Grande</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[6px] sm:text-[8px]">a partir de</p>
                        <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Média</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[6px] sm:text-[8px]">a partir de</p>
                        <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Pequena</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[6px] sm:text-[8px]">a partir de</p>
                        <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mt-3 mb-2">Categoria 2</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px] leading-tight">Nome do item</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Categories view mockup - Mostra categorias primeiro */}
              <PhoneMockup isSelected={navegacao === 'categorias'} onClick={() => setNavegacao('categorias')}>
                <PhoneHeader />
                <div className="p-2 bg-[#0d2847] flex-1">
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="py-2 px-1.5 bg-[#1a3a5c] border border-[#2d5a8a] rounded text-center">
                        <p className="text-[7px] sm:text-[9px] text-slate-300 leading-tight">Nome da</p>
                        <p className="text-[7px] sm:text-[9px] text-slate-300 leading-tight">categoria</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'fotos' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Exibir a foto dos itens:</h3>
              <RadioOption
                selected={fotos === 'exibir'}
                onSelect={() => setFotos('exibir')}
                label="Exibir fotos"
              />
              <RadioOption
                selected={fotos === 'nao_exibir'}
                onSelect={() => setFotos('nao_exibir')}
                label="Não exibir fotos"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Com fotos - mostra imagens dos produtos */}
              <PhoneMockup isSelected={fotos === 'exibir'} onClick={() => setFotos('exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Grande</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Sem fotos - apenas texto */}
              <PhoneMockup isSelected={fotos === 'nao_exibir'} onClick={() => setFotos('nao_exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Grande</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'descricoes' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Exibir a descrição dos itens:</h3>
              <RadioOption
                selected={descricoes === 'exibir'}
                onSelect={() => setDescricoes('exibir')}
                label="Exibir descrições"
              />
              <RadioOption
                selected={descricoes === 'nao_exibir'}
                onSelect={() => setDescricoes('nao_exibir')}
                label="Não exibir descrições"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Com descrições */}
              <PhoneMockup isSelected={descricoes === 'exibir'} onClick={() => setDescricoes('exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Grande</p>
                        <p className="text-slate-400 text-[6px] sm:text-[8px] truncate">Calabresa com cebola...</p>
                      </div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Média</p>
                        <p className="text-slate-400 text-[6px] sm:text-[8px] truncate">Calabresa com cebola...</p>
                      </div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Sem descrições */}
              <PhoneMockup isSelected={descricoes === 'nao_exibir'} onClick={() => setDescricoes('nao_exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Grande</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'esgotados' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Exibir itens e adicionais esgotados:</h3>
              <RadioOption
                selected={esgotados === 'exibir'}
                onSelect={() => setEsgotados('exibir')}
                label="Exibir itens e adicionais esgotados"
              />
              <RadioOption
                selected={esgotados === 'nao_exibir'}
                onSelect={() => setEsgotados('nao_exibir')}
                label="Não exibir itens esgotados"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Exibe esgotados - mostra item com "Esgotado" */}
              <PhoneMockup isSelected={esgotados === 'exibir'} onClick={() => setEsgotados('exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 opacity-50">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-gray-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm sm:text-base">🍕</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-[8px] sm:text-[10px]">Grande</p>
                        <p className="text-red-400 text-[6px] sm:text-[8px]">Esgotado</p>
                      </div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Oculta esgotados - não mostra item esgotado */}
              <PhoneMockup isSelected={esgotados === 'nao_exibir'} onClick={() => setEsgotados('nao_exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'precos' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Exibir preços dos itens:</h3>
              <RadioOption
                selected={precos === 'exibir'}
                onSelect={() => setPrecos('exibir')}
                label="Exibir preços"
              />
              <RadioOption
                selected={precos === 'nao_exibir'}
                onSelect={() => setPrecos('nao_exibir')}
                label="Não exibir preços"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Com preços */}
              <PhoneMockup isSelected={precos === 'exibir'} onClick={() => setPrecos('exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Grande</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 45,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 35,90</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                      <p className="text-white text-[8px] sm:text-[10px] font-medium">R$ 25,90</p>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Sem preços */}
              <PhoneMockup isSelected={precos === 'nao_exibir'} onClick={() => setPrecos('nao_exibir')}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c] overflow-hidden">
                  <span className="px-1.5 py-1 bg-cyan-500 text-white text-[8px] sm:text-[10px] font-medium">Pizzas</span>
                  <span className="px-1.5 py-1 text-slate-400 text-[8px] sm:text-[10px]">Cat 2</span>
                </div>
                <div className="p-2 bg-[#1a3a5c] flex-1">
                  <p className="text-white text-[9px] sm:text-[10px] font-medium mb-2">Pizzas</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Grande</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Média</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-[8px] sm:text-[10px]">Pequena</p></div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'tela_inicial' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Visualização padrão da Home:</h3>
              <RadioOption
                selected={telaInicial === 'mesas'}
                onSelect={() => setTelaInicial('mesas')}
                label="Mapa de Mesas"
              />
              <RadioOption
                selected={telaInicial === 'comandas'}
                onSelect={() => setTelaInicial('comandas')}
                label="Mapa de Comandas"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Mesas - aba Mesas selecionada */}
              <PhoneMockup isSelected={telaInicial === 'mesas'} onClick={() => setTelaInicial('mesas')}>
                <div className="px-2 py-1.5 flex items-center justify-between bg-[#0d2847]">
                  <div className="flex items-center gap-1">
                    <span className="text-white text-[8px]">≡</span>
                    <span className="text-white text-[7px] sm:text-[9px]">Mapa de mesas</span>
                  </div>
                  <span className="text-slate-400 text-[8px]">🔔</span>
                </div>
                <div className="p-2 bg-[#0d2847] flex-1">
                  <div className="flex gap-1 mb-2">
                    <span className="flex-1 text-center py-1 bg-cyan-500 text-white text-[7px] sm:text-[8px] rounded">Mesas</span>
                    <span className="flex-1 text-center py-1 bg-[#1e4976] text-slate-400 text-[7px] sm:text-[8px] rounded">Comandas</span>
                  </div>
                  <div className="flex gap-2 mb-2 text-[6px] sm:text-[7px]">
                    <span className="text-green-400">● Livres</span>
                    <span className="text-red-400">● Ocupadas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="py-1.5 bg-[#1e4976] rounded text-center">
                        <p className="text-[6px] sm:text-[8px] text-white">Mesa {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>

              {/* Comandas - aba Comandas selecionada */}
              <PhoneMockup isSelected={telaInicial === 'comandas'} onClick={() => setTelaInicial('comandas')}>
                <div className="px-2 py-1.5 flex items-center justify-between bg-[#0d2847]">
                  <div className="flex items-center gap-1">
                    <span className="text-white text-[8px]">≡</span>
                    <span className="text-white text-[7px] sm:text-[9px]">Mapa de comandas</span>
                  </div>
                  <span className="text-slate-400 text-[8px]">🔔</span>
                </div>
                <div className="p-2 bg-[#0d2847] flex-1">
                  <div className="flex gap-1 mb-2">
                    <span className="flex-1 text-center py-1 bg-[#1e4976] text-slate-400 text-[7px] sm:text-[8px] rounded">Mesas</span>
                    <span className="flex-1 text-center py-1 bg-cyan-500 text-white text-[7px] sm:text-[8px] rounded">Comandas</span>
                  </div>
                  <div className="flex gap-2 mb-2 text-[6px] sm:text-[7px]">
                    <span className="text-green-400">● Livres</span>
                    <span className="text-red-400">● Ocupadas</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="py-1.5 bg-[#1e4976] rounded text-center">
                        <p className="text-[6px] sm:text-[8px] text-white">Cmd {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
          </div>
        )}

        {activeTab === 'som' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-medium mb-3">Som de notificação:</h3>
              <p className="text-slate-400 text-sm mb-4">
                Tocar som quando uma mesa solicitar o fechamento da conta (status "Em pagamento")
              </p>
              <RadioOption
                selected={somNotificacao === 'ativado'}
                onSelect={() => setSomNotificacao('ativado')}
                label="Som ativado"
              />
              <RadioOption
                selected={somNotificacao === 'desativado'}
                onSelect={() => setSomNotificacao('desativado')}
                label="Som desativado"
              />
            </div>
            
            <div className="images-container mt-4 mx-auto flex w-full gap-2 sm:gap-4 items-stretch justify-center">
              {/* Som ativado */}
              <div 
                onClick={() => setSomNotificacao('ativado')}
                className={`w-[calc(50%-8px)] max-w-[200px] aspect-square flex-shrink-0 bg-[#0d2847] rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  somNotificacao === 'ativado' ? 'border-cyan-400' : 'border-[#1e4976]'
                }`}
              >
                <Volume2 className={`w-12 h-12 mb-3 ${somNotificacao === 'ativado' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${somNotificacao === 'ativado' ? 'text-cyan-400' : 'text-slate-400'}`}>
                  Ativado
                </span>
              </div>

              {/* Som desativado */}
              <div 
                onClick={() => setSomNotificacao('desativado')}
                className={`w-[calc(50%-8px)] max-w-[200px] aspect-square flex-shrink-0 bg-[#0d2847] rounded-lg border-2 overflow-hidden flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                  somNotificacao === 'desativado' ? 'border-cyan-400' : 'border-[#1e4976]'
                }`}
              >
                <VolumeX className={`w-12 h-12 mb-3 ${somNotificacao === 'desativado' ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className={`text-sm font-medium ${somNotificacao === 'desativado' ? 'text-cyan-400' : 'text-slate-400'}`}>
                  Desativado
                </span>
              </div>
            </div>

            {somNotificacao === 'ativado' && (
              <button
                onClick={() => {
                  const audio = new Audio('/notification.mp3');
                  audio.volume = 0.7;
                  audio.play().catch(err => console.log('Audio play failed:', err));
                  toast.success('Som de teste reproduzido!');
                }}
                className="w-full py-3 bg-[#1e4976] text-cyan-400 font-medium rounded-lg hover:bg-[#2d5a8a] transition-colors flex items-center justify-center gap-2"
              >
                <Volume2 className="w-5 h-5" />
                Testar som
              </button>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1628]">
        <button
          onClick={handleSave}
          className="w-full py-3 bg-slate-500 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

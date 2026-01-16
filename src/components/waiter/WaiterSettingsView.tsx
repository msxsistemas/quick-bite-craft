import { ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WaiterSettingsViewProps {
  onBack: () => void;
  restaurantName?: string;
}

type SettingsTab = 'navegacao' | 'fotos' | 'descricoes' | 'esgotados' | 'tela_inicial';

export const WaiterSettingsView = ({ onBack, restaurantName }: WaiterSettingsViewProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('navegacao');
  
  // Settings states
  const [navegacao, setNavegacao] = useState<'itens' | 'categorias'>('itens');
  const [fotos, setFotos] = useState<'exibir' | 'nao_exibir'>('exibir');
  const [descricoes, setDescricoes] = useState<'exibir' | 'nao_exibir'>('exibir');
  const [esgotados, setEsgotados] = useState<'exibir' | 'nao_exibir'>('exibir');
  const [telaInicial, setTelaInicial] = useState<'mesas' | 'comandas'>('mesas');

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'navegacao', label: 'Navegação' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'descricoes', label: 'Descrições' },
    { id: 'esgotados', label: 'Esgotados' },
    { id: 'tela_inicial', label: 'Tela inicial' },
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
  }: {
    children: React.ReactNode;
    isSelected: boolean;
  }) => (
    <div
      className={`w-[280px] max-h-[320px] bg-[#0d2847] rounded-lg border-2 overflow-hidden ${
        isSelected ? 'border-cyan-400' : 'border-[#1e4976]'
      }`}
    >
      {children}
    </div>
  );

  // Phone header component
  const PhoneHeader = ({ title = "Mesa 4" }: { title?: string }) => (
    <div className="px-3 py-2 flex items-center justify-between bg-[#0d2847]">
      <div className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">{title}</span>
      </div>
      <Search className="w-4 h-4 text-slate-400" />
    </div>
  );

  // Pizza image placeholder
  const PizzaImage = () => (
    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
      <span className="text-lg">🍕</span>
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
            
            <div className="flex justify-center gap-16 mt-8">
              {/* Items view mockup */}
              <PhoneMockup isSelected={navegacao === 'itens'}>
                <PhoneHeader />
                {/* Category tabs */}
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 3</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Cate</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  
                  {/* Product items */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Grande</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Média</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Pequena</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-white text-xs font-medium mt-4 mb-3">Categoria 2</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs leading-tight">Nome do item do cardápio</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs leading-tight">Nome do item do cardápio</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Categories view mockup */}
              <PhoneMockup isSelected={navegacao === 'categorias'}>
                <PhoneHeader />
                <div className="p-3 bg-[#0d2847]">
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <div key={i} className="py-3 px-2 bg-[#1a3a5c] border border-[#2d5a8a] rounded text-center">
                        <p className="text-[10px] text-slate-300 leading-tight">Nome da</p>
                        <p className="text-[10px] text-slate-300 leading-tight">categoria</p>
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
            
            <div className="flex justify-center gap-16 mt-8">
              {/* With photos mockup */}
              <PhoneMockup isSelected={fotos === 'exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 3</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Grande</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Média</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Pequena</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Without photos mockup */}
              <PhoneMockup isSelected={fotos === 'nao_exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 3</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><p className="text-white text-xs">Grande</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><p className="text-white text-xs">Média</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1"><p className="text-white text-xs">Pequena</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
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
            
            <div className="flex justify-center gap-16 mt-8">
              {/* With descriptions mockup */}
              <PhoneMockup isSelected={descricoes === 'exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Grande</p>
                        <p className="text-slate-400 text-[9px] truncate">Pizza de calabresa com cebola...</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Média</p>
                        <p className="text-slate-400 text-[9px] truncate">Pizza de calabresa com cebola...</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Without descriptions mockup */}
              <PhoneMockup isSelected={descricoes === 'nao_exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Grande</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Média</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Pequena</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
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
            
            <div className="flex justify-center gap-16 mt-8">
              {/* Show sold out mockup */}
              <PhoneMockup isSelected={esgotados === 'exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 opacity-50">
                      <div className="w-9 h-9 rounded-lg bg-gray-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg">🍕</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs">Grande</p>
                        <p className="text-red-400 text-[9px]">Esgotado</p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 45,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Média</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Pequena</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
                    </div>
                  </div>
                </div>
              </PhoneMockup>

              {/* Hide sold out mockup */}
              <PhoneMockup isSelected={esgotados === 'nao_exibir'}>
                <PhoneHeader />
                <div className="flex bg-[#1a3a5c]">
                  <span className="px-3 py-2 bg-cyan-500 text-white text-xs font-medium">Pizzas</span>
                  <span className="px-3 py-2 text-slate-400 text-xs">Categoria 2</span>
                </div>
                <div className="p-3 bg-[#1a3a5c]">
                  <p className="text-white text-xs font-medium mb-3">Pizzas</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Média</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 35,90</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <PizzaImage />
                      <div className="flex-1"><p className="text-white text-xs">Pequena</p></div>
                      <div className="text-right">
                        <p className="text-slate-400 text-[9px]">a partir de</p>
                        <p className="text-white text-xs font-medium">R$ 25,90</p>
                      </div>
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
            
            <div className="flex justify-center gap-16 mt-8">
              {/* Mesas mockup */}
              <PhoneMockup isSelected={telaInicial === 'mesas'}>
                <div className="px-3 py-2 flex items-center justify-between bg-[#0d2847]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-white">≡</div>
                    <span className="text-white text-[10px]">Mapa de mesas e comandas</span>
                  </div>
                  <div className="text-slate-400">🔔</div>
                </div>
                <div className="p-3 bg-[#0d2847]">
                  <div className="flex gap-2 mb-3">
                    <span className="flex-1 text-center py-1.5 bg-cyan-500 text-white text-[10px] rounded">Mesas</span>
                    <span className="flex-1 text-center py-1.5 bg-[#1e4976] text-slate-400 text-[10px] rounded">Comandas</span>
                  </div>
                  <div className="flex gap-3 mb-3 text-[8px]">
                    <span className="text-green-400">● Livres</span>
                    <span className="text-red-400">● Ocupadas</span>
                    <span className="text-amber-400">● Fechando</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="py-2 bg-[#1e4976] rounded text-center">
                        <p className="text-[9px] text-white">Mesa {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>

              {/* Comandas mockup */}
              <PhoneMockup isSelected={telaInicial === 'comandas'}>
                <div className="px-3 py-2 flex items-center justify-between bg-[#0d2847]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 text-white">≡</div>
                    <span className="text-white text-[10px]">Mapa de mesas e comandas</span>
                  </div>
                  <div className="text-slate-400">🔔</div>
                </div>
                <div className="p-3 bg-[#0d2847]">
                  <div className="flex gap-2 mb-3">
                    <span className="flex-1 text-center py-1.5 bg-[#1e4976] text-slate-400 text-[10px] rounded">Mesas</span>
                    <span className="flex-1 text-center py-1.5 bg-cyan-500 text-white text-[10px] rounded">Comandas</span>
                  </div>
                  <div className="flex gap-3 mb-3 text-[8px]">
                    <span className="text-green-400">● Livres</span>
                    <span className="text-red-400">● Ocupadas</span>
                    <span className="text-amber-400">● Fechando</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="py-2 bg-[#1e4976] rounded text-center">
                        <p className="text-[9px] text-white">Comanda {i + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneMockup>
            </div>
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

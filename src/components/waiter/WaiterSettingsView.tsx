import { ArrowLeft } from 'lucide-react';
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
      className="flex items-center gap-3 w-full py-3"
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
        selected ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'
      }`}>
        {selected && <div className="w-3 h-3 rounded-full bg-[#0a1628]" />}
      </div>
      <span className="text-white">{label}</span>
    </button>
  );

  // Preview component for navigation tab
  const NavigationPreview = ({ startWithItems }: { startWithItems: boolean }) => (
    <div className={`flex-1 bg-[#0d2847] rounded-xl border-2 overflow-hidden ${
      (startWithItems && navegacao === 'itens') || (!startWithItems && navegacao === 'categorias') 
        ? 'border-cyan-400' 
        : 'border-[#1e4976]'
    }`}>
      <div className="p-2 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-1">
          <ArrowLeft className="w-3 h-3 text-white" />
          <span className="text-white text-xs">Mesa 4</span>
        </div>
        <div className="w-3 h-3 text-slate-400">🔍</div>
      </div>
      <div className="p-2">
        {startWithItems ? (
          <>
            <div className="flex gap-1 mb-2 overflow-x-auto">
              <span className="px-2 py-0.5 bg-cyan-500 text-white text-[8px] rounded whitespace-nowrap">Pizzas</span>
              <span className="px-2 py-0.5 bg-[#1e4976] text-slate-400 text-[8px] rounded whitespace-nowrap">Categoria 2</span>
              <span className="px-2 py-0.5 bg-[#1e4976] text-slate-400 text-[8px] rounded whitespace-nowrap">Categoria 3</span>
            </div>
            <div className="space-y-1">
              {['Grande', 'Média', 'Pequena'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
                  <div className="w-6 h-6 bg-orange-400 rounded" />
                  <div className="flex-1">
                    <p className="text-white text-[8px]">{item}</p>
                  </div>
                  <span className="text-[8px] text-slate-400">R$ {45.90 - i * 10}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="p-2 bg-[#1e4976] rounded text-center">
                <p className="text-[7px] text-slate-400">Nome da</p>
                <p className="text-[7px] text-slate-400">categoria</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Preview component for photos tab
  const PhotosPreview = ({ showPhotos }: { showPhotos: boolean }) => (
    <div className={`flex-1 bg-[#0d2847] rounded-xl border-2 overflow-hidden ${
      (showPhotos && fotos === 'exibir') || (!showPhotos && fotos === 'nao_exibir') 
        ? 'border-cyan-400' 
        : 'border-[#1e4976]'
    }`}>
      <div className="p-2 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-1">
          <ArrowLeft className="w-3 h-3 text-white" />
          <span className="text-white text-xs">Mesa 4</span>
        </div>
        <div className="w-3 h-3 text-slate-400">🔍</div>
      </div>
      <div className="p-2">
        <div className="flex gap-1 mb-2 overflow-x-auto">
          <span className="px-2 py-0.5 bg-cyan-500 text-white text-[8px] rounded whitespace-nowrap">Pizzas</span>
          <span className="px-2 py-0.5 bg-[#1e4976] text-slate-400 text-[8px] rounded whitespace-nowrap">Categoria 2</span>
        </div>
        <div className="space-y-1">
          {['Grande', 'Média', 'Pequena'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
              {showPhotos && <div className="w-6 h-6 bg-orange-400 rounded" />}
              <div className="flex-1">
                <p className="text-white text-[8px]">{item}</p>
              </div>
              <span className="text-[8px] text-slate-400">R$ {45.90 - i * 10}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Preview component for descriptions tab
  const DescriptionsPreview = ({ showDescriptions }: { showDescriptions: boolean }) => (
    <div className={`flex-1 bg-[#0d2847] rounded-xl border-2 overflow-hidden ${
      (showDescriptions && descricoes === 'exibir') || (!showDescriptions && descricoes === 'nao_exibir') 
        ? 'border-cyan-400' 
        : 'border-[#1e4976]'
    }`}>
      <div className="p-2 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-1">
          <ArrowLeft className="w-3 h-3 text-white" />
          <span className="text-white text-xs">Mesa 4</span>
        </div>
        <div className="w-3 h-3 text-slate-400">🔍</div>
      </div>
      <div className="p-2">
        <div className="flex gap-1 mb-2 overflow-x-auto">
          <span className="px-2 py-0.5 bg-cyan-500 text-white text-[8px] rounded whitespace-nowrap">Categoria 1</span>
          <span className="px-2 py-0.5 bg-[#1e4976] text-slate-400 text-[8px] rounded whitespace-nowrap">Categoria 2</span>
        </div>
        <div className="space-y-1">
          {['Item 1', 'Item 2', 'Item 3'].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
              <div className="w-6 h-6 bg-orange-400 rounded" />
              <div className="flex-1">
                <p className="text-white text-[8px]">{item}</p>
                {showDescriptions && (
                  <p className="text-[6px] text-slate-400 truncate">Pizza de calabresa com cebola...</p>
                )}
              </div>
              <span className="text-[8px] text-slate-400">R$ {45.90 - i * 10}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Preview component for sold out items tab
  const SoldOutPreview = ({ showSoldOut }: { showSoldOut: boolean }) => (
    <div className={`flex-1 bg-[#0d2847] rounded-xl border-2 overflow-hidden ${
      (showSoldOut && esgotados === 'exibir') || (!showSoldOut && esgotados === 'nao_exibir') 
        ? 'border-cyan-400' 
        : 'border-[#1e4976]'
    }`}>
      <div className="p-2 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-1">
          <ArrowLeft className="w-3 h-3 text-white" />
          <span className="text-white text-xs">Mesa 4</span>
        </div>
        <div className="w-3 h-3 text-slate-400">🔍</div>
      </div>
      <div className="p-2">
        <div className="flex gap-1 mb-2 overflow-x-auto">
          <span className="px-2 py-0.5 bg-cyan-500 text-white text-[8px] rounded whitespace-nowrap">Categoria 1</span>
          <span className="px-2 py-0.5 bg-[#1e4976] text-slate-400 text-[8px] rounded whitespace-nowrap">Categoria 2</span>
        </div>
        <div className="space-y-1">
          {showSoldOut ? (
            <>
              <div className="flex items-center gap-2 p-1 bg-[#1e4976] rounded opacity-50">
                <div className="w-6 h-6 bg-gray-500 rounded" />
                <div className="flex-1">
                  <p className="text-white text-[8px]">Item 1</p>
                  <p className="text-[6px] text-red-400">Esgotado</p>
                </div>
                <span className="text-[8px] text-slate-400">R$ 45,90</span>
              </div>
              <div className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
                <div className="w-6 h-6 bg-orange-400 rounded" />
                <div className="flex-1">
                  <p className="text-white text-[8px]">Item 2</p>
                </div>
                <span className="text-[8px] text-slate-400">R$ 35,90</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
                <div className="w-6 h-6 bg-orange-400 rounded" />
                <div className="flex-1">
                  <p className="text-white text-[8px]">Item 2</p>
                </div>
                <span className="text-[8px] text-slate-400">R$ 35,90</span>
              </div>
              <div className="flex items-center gap-2 p-1 bg-[#1e4976] rounded">
                <div className="w-6 h-6 bg-orange-400 rounded" />
                <div className="flex-1">
                  <p className="text-white text-[8px]">Item 3</p>
                </div>
                <span className="text-[8px] text-slate-400">R$ 25,90</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Preview component for home screen tab
  const HomeScreenPreview = ({ showMesas }: { showMesas: boolean }) => (
    <div className={`flex-1 bg-[#0d2847] rounded-xl border-2 overflow-hidden ${
      (showMesas && telaInicial === 'mesas') || (!showMesas && telaInicial === 'comandas') 
        ? 'border-cyan-400' 
        : 'border-[#1e4976]'
    }`}>
      <div className="p-2 flex items-center justify-between border-b border-[#1e4976]">
        <div className="flex items-center gap-1">
          <div className="text-white text-[8px]">≡</div>
          <span className="text-white text-[8px]">Mapa de mesas e comandas</span>
        </div>
        <div className="w-3 h-3 text-slate-400">🔔</div>
      </div>
      <div className="p-2">
        <div className="flex gap-1 mb-2">
          <span className={`flex-1 text-center py-1 text-[8px] rounded ${showMesas ? 'bg-cyan-500 text-white' : 'bg-cyan-500 text-white'}`}>
            {showMesas ? 'Mesas' : 'Comandas'}
          </span>
          <span className={`flex-1 text-center py-1 text-[8px] rounded bg-[#1e4976] text-slate-400`}>
            {showMesas ? 'Comandas' : 'Mesas'}
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2 text-[6px] text-slate-400">
          <span>● Livres</span>
          <span className="text-red-400">● Ocupadas</span>
          <span className="text-amber-400">● Fechando conta</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-1 bg-[#1e4976] rounded text-center">
              <p className="text-[7px] text-white">{showMesas ? `Mesa ${i + 1}` : `Comanda ${i + 1}`}</p>
            </div>
          ))}
          <div className="p-1 border border-dashed border-[#1e4976] rounded text-center">
            <p className="text-[7px] text-slate-400">+</p>
            <p className="text-[5px] text-slate-400">{showMesas ? 'Criar Mesas' : 'Criar Comanda'}</p>
          </div>
        </div>
        <div className="mt-2 p-1 border border-[#1e4976] rounded text-center">
          <p className="text-[6px] text-slate-400">🚀 Delivery/Para Levar</p>
        </div>
      </div>
    </div>
  );

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
        <h1 className="text-white font-semibold text-lg">Configurações</h1>
      </header>

      {/* Tabs */}
      <div className="bg-[#0d2847] border-b border-[#1e4976] overflow-x-auto">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {activeTab === 'navegacao' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Modo de navegação do cardápio:</h3>
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
            <div className="flex gap-3">
              <NavigationPreview startWithItems={true} />
              <NavigationPreview startWithItems={false} />
            </div>
          </div>
        )}

        {activeTab === 'fotos' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Exibir a foto dos itens:</h3>
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
            <div className="flex gap-3">
              <PhotosPreview showPhotos={true} />
              <PhotosPreview showPhotos={false} />
            </div>
          </div>
        )}

        {activeTab === 'descricoes' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Exibir a descrição dos itens:</h3>
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
            <div className="flex gap-3">
              <DescriptionsPreview showDescriptions={true} />
              <DescriptionsPreview showDescriptions={false} />
            </div>
          </div>
        )}

        {activeTab === 'esgotados' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Exibir itens e adicionais esgotados:</h3>
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
            <div className="flex gap-3">
              <SoldOutPreview showSoldOut={true} />
              <SoldOutPreview showSoldOut={false} />
            </div>
          </div>
        )}

        {activeTab === 'tela_inicial' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Visualização padrão da Home:</h3>
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
            <div className="flex gap-3">
              <HomeScreenPreview showMesas={true} />
              <HomeScreenPreview showMesas={false} />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a1628]">
        <button
          onClick={handleSave}
          className="w-full py-4 bg-cyan-500 rounded-xl text-white font-medium hover:bg-cyan-600 transition-colors"
        >
          Salvar
        </button>
      </div>
    </div>
  );
};

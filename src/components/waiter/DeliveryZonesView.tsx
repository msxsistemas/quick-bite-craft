import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  min_order: number;
  visible: boolean;
}

interface DeliveryZonesViewProps {
  zones: DeliveryZone[];
  isLoading: boolean;
  onBack: () => void;
  onSelectZone: (zone: DeliveryZone) => void;
  selectedZoneId?: string;
}

export const DeliveryZonesView = ({
  zones,
  isLoading,
  onBack,
  onSelectZone,
  selectedZoneId,
}: DeliveryZonesViewProps) => {
  const visibleZones = zones.filter(z => z.visible);

  return (
    <div className="min-h-screen bg-[#0d2847] flex flex-col">
      {/* Header */}
      <header className="bg-[#0d2847] border-b border-[#1e4976] px-4 py-3 flex items-center gap-3">
        <button 
          onClick={onBack}
          className="p-2 text-white hover:bg-[#1e4976] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-white font-semibold">Selecione a região</h1>
          <p className="text-slate-400 text-sm">Bairros disponíveis para entrega</p>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="p-4">
          <div className="bg-cyan-500 text-white px-4 py-2 rounded-t-xl font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Regiões de entrega
          </div>
          <div className="bg-[#0d2847] rounded-b-xl border border-[#1e4976] border-t-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
              </div>
            ) : visibleZones.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma região de entrega cadastrada</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e4976]">
                {visibleZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => onSelectZone(zone)}
                      className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                        isSelected ? 'bg-cyan-500/20' : 'hover:bg-[#1e4976]/50'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium">{zone.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-cyan-400 text-sm">
                            Taxa: {formatCurrency(zone.fee)}
                          </span>
                          {zone.min_order > 0 && (
                            <span className="text-slate-400 text-sm">
                              Mín: {formatCurrency(zone.min_order)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-cyan-500 bg-cyan-500' : 'border-slate-500'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Clock, MapPin, Plus, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

type ChargeMode = 'fixed' | 'zone';

interface DeliveryZone {
  id: number;
  name: string;
  fee: number;
  minOrder: number;
  visible: boolean;
}

const DeliveryFeesPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [chargeMode, setChargeMode] = useState<ChargeMode>('zone');
  const [minTime, setMinTime] = useState('30');
  const [maxTime, setMaxTime] = useState('50');

  const [zones] = useState<DeliveryZone[]>([
    { id: 1, name: 'Centro', fee: 5.00, minOrder: 20.00, visible: true },
    { id: 2, name: 'Consolação', fee: 6.00, minOrder: 25.00, visible: true },
    { id: 3, name: 'Jardins', fee: 4.00, minOrder: 30.00, visible: true },
    { id: 4, name: 'Vila Mariana', fee: 8.00, minOrder: 30.00, visible: true },
  ]);

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Delivery Time Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Tempo de Entrega</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Defina o tempo estimado para as entregas</p>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tempo Mínimo (min)
              </label>
              <input
                type="number"
                value={minTime}
                onChange={(e) => setMinTime(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tempo Máximo (min)
              </label>
              <input
                type="number"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Será exibido como: {minTime}-{maxTime} min
          </p>
        </div>

        {/* Charge Mode Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Modo de Cobrança</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Escolha como será calculada a taxa de entrega</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setChargeMode('fixed')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                chargeMode === 'fixed'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  chargeMode === 'fixed' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {chargeMode === 'fixed' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Taxa Fixa</h3>
                  <p className="text-sm text-muted-foreground">Valor único para todas as entregas</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setChargeMode('zone')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                chargeMode === 'zone'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  chargeMode === 'zone' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {chargeMode === 'zone' && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Por Bairro/Zona</h3>
                  <p className="text-sm text-muted-foreground">Taxa diferente para cada bairro ou região</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Delivery Zones Section */}
        {chargeMode === 'zone' && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Zonas de Entrega</h2>
                <p className="text-sm text-muted-foreground">Configure a taxa para cada bairro ou região</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                <Plus className="w-4 h-4" />
                Nova Zona
              </button>
            </div>

            <div className="space-y-3">
              {zones.map((zone) => (
                <div 
                  key={zone.id} 
                  className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors"
                >
                  {/* Zone Icon */}
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>

                  {/* Zone Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{zone.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">R$ {zone.fee.toFixed(2).replace('.', ',')}</span>
                      {' '}• Pedido mín: R$ {zone.minOrder.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                      {zone.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default DeliveryFeesPage;

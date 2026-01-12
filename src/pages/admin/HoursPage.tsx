import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Clock, Pencil, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface DaySchedule {
  id: number;
  day: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

const HoursPage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [schedule, setSchedule] = useState<DaySchedule[]>([
    { id: 1, day: 'Domingo', startTime: '18:00', endTime: '23:00', active: true },
    { id: 2, day: 'Segunda', startTime: '11:30', endTime: '14:30', active: true },
    { id: 3, day: 'Terça', startTime: '12:30', endTime: '14:30', active: true },
    { id: 4, day: 'Quarta', startTime: '11:30', endTime: '22:30', active: true },
    { id: 5, day: 'Quinta', startTime: '11:30', endTime: '23:00', active: true },
    { id: 6, day: 'Sexta', startTime: '11:30', endTime: '00:00', active: true },
    { id: 7, day: 'Sábado', startTime: '03:30', endTime: '10:00', active: true },
  ]);

  const toggleDayActive = (id: number) => {
    setSchedule(prev =>
      prev.map(day => day.id === id ? { ...day, active: !day.active } : day)
    );
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6 max-w-2xl">
        {/* Header Card */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Configure os horários de funcionamento</h2>
              <p className="text-sm text-muted-foreground">Defina quando sua loja está aberta para receber pedidos</p>
            </div>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-3">
          {schedule.map((day) => (
            <div
              key={day.id}
              className="flex items-center gap-4 py-4 border-b border-border last:border-0"
            >
              {/* Toggle */}
              <Switch
                checked={day.active}
                onCheckedChange={() => toggleDayActive(day.id)}
                className="data-[state=checked]:bg-amber-500"
              />

              {/* Day Name */}
              <span className="font-medium text-foreground w-24">{day.day}</span>

              {/* Time Range */}
              <span className="text-sm text-muted-foreground">
                {day.startTime} às {day.endTime}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-auto">
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

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground text-center">
          Os horários são salvos automaticamente ao clicar em salvar
        </p>
      </div>
    </AdminLayout>
  );
};

export default HoursPage;

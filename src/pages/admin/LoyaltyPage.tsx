import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Gift, Pencil, Trash2, Star, X, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { useRestaurantSettings } from '@/hooks/useRestaurantSettings';
import { useRestaurantBySlug } from '@/hooks/useRestaurantBySlug';
import {
  useAllLoyaltyRewards,
  useCreateLoyaltyReward,
  useUpdateLoyaltyReward,
  useDeleteLoyaltyReward,
  LoyaltyReward,
} from '@/hooks/useLoyalty';
import { formatCurrency } from '@/lib/format';
import { CurrencyInput } from '@/components/ui/currency-input';
import { toast } from '@/components/ui/app-toast';

const LoyaltyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { restaurant, isLoading: restaurantLoading } = useRestaurantBySlug(slug);
  const { settings, updateSettings, isLoading: settingsLoading } = useRestaurantSettings(restaurant?.id);
  const { data: rewards = [], isLoading: rewardsLoading } = useAllLoyaltyRewards(restaurant?.id);
  const createReward = useCreateLoyaltyReward();
  const updateReward = useUpdateLoyaltyReward();
  const deleteReward = useDeleteLoyaltyReward();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [deleteRewardData, setDeleteRewardData] = useState<LoyaltyReward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points_required: 100,
    discount_type: 'fixed' as 'fixed' | 'percent',
    discount_value: 10,
    min_order_value: 0,
    active: true,
  });

  const isLoading = restaurantLoading || settingsLoading || rewardsLoading;

  const handleToggleLoyalty = async (enabled: boolean) => {
    try {
      await updateSettings({ loyalty_enabled: enabled });
    } catch (error) {
      console.error('Failed to toggle loyalty:', error);
    }
  };

  const handleUpdateSettings = async (field: string, value: number) => {
    try {
      await updateSettings({ [field]: value });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleOpenDialog = (reward?: LoyaltyReward) => {
    if (reward) {
      setEditingReward(reward);
      setFormData({
        name: reward.name,
        description: reward.description || '',
        points_required: reward.points_required,
        discount_type: reward.discount_type,
        discount_value: reward.discount_value,
        min_order_value: reward.min_order_value,
        active: reward.active,
      });
    } else {
      setEditingReward(null);
      setFormData({
        name: '',
        description: '',
        points_required: 100,
        discount_type: 'fixed',
        discount_value: 10,
        min_order_value: 0,
        active: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveReward = async () => {
    if (!restaurant?.id || !formData.name) return;

    try {
      if (editingReward) {
        await updateReward.mutateAsync({
          id: editingReward.id,
          ...formData,
        });
        toast.success('Recompensa atualizada!');
      } else {
        await createReward.mutateAsync({
          restaurant_id: restaurant.id,
          ...formData,
          sort_order: rewards.length,
        });
        toast.success('Recompensa criada!');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao salvar recompensa');
    }
  };

  const handleDeleteRewardClick = (reward: LoyaltyReward) => {
    setDeleteRewardData(reward);
  };

  const handleConfirmDeleteReward = async () => {
    if (!restaurant?.id || !deleteRewardData) return;

    try {
      await deleteReward.mutateAsync({ id: deleteRewardData.id, restaurantId: restaurant.id });
      toast.success('Recompensa excluída!');
      setDeleteRewardData(null);
    } catch (error) {
      toast.error('Erro ao excluir recompensa');
    }
  };

  return (
    <AdminLayout type="restaurant" restaurantSlug={slug}>
      <div className="space-y-6">
        {/* Toggle and Settings */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-foreground">Programa de Fidelidade</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Recompense seus clientes frequentes com pontos e descontos
              </p>
            </div>
            <Switch
              checked={settings?.loyalty_enabled || false}
              onCheckedChange={handleToggleLoyalty}
            />
          </div>
          {settings?.loyalty_enabled && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Pontos por R$ gasto</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={settings?.loyalty_points_per_real || 1}
                    onChange={(e) => handleUpdateSettings('loyalty_points_per_real', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ex: 1 = 1 ponto por R$1 gasto
                  </p>
                </div>
                <div>
                  <Label>Pedido mínimo para ganhar pontos (R$)</Label>
                  <CurrencyInput
                    value={settings?.loyalty_min_order_for_points || 0}
                    onChange={(value) => handleUpdateSettings('loyalty_min_order_for_points', value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe 0,00 para não ter mínimo
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rewards List */}
        {settings?.loyalty_enabled && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground">Recompensas</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Configure as recompensas que os clientes podem resgatar
                </p>
              </div>
              <Button onClick={() => handleOpenDialog()} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Recompensa
              </Button>
            </div>
            <div className="pt-4 border-t border-border">
              {rewards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma recompensa cadastrada</p>
                  <p className="text-sm">Crie recompensas para seus clientes resgatarem</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className={`flex items-center justify-between p-4 rounded-xl border ${
                        reward.active ? 'border-border bg-background' : 'border-muted bg-muted/50 opacity-60'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{reward.name}</span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {reward.points_required} pts
                          </span>
                          {!reward.active && (
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {reward.discount_type === 'percent'
                            ? `${reward.discount_value}% de desconto`
                            : `${formatCurrency(reward.discount_value)} de desconto`}
                          {reward.min_order_value > 0 && ` • Pedido mínimo: ${formatCurrency(reward.min_order_value)}`}
                        </p>
                        {reward.description && (
                          <p className="text-xs text-muted-foreground mt-1">{reward.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(reward)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteRewardClick(reward)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reward Panel */}
      {isDialogOpen && (
        <>
          {/* Overlay - only on mobile */}
          <div 
            className="fixed inset-0 z-40 bg-black/30 md:bg-transparent md:pointer-events-none"
            onClick={() => setIsDialogOpen(false)}
          />
          
          {/* Panel */}
          <div className="fixed inset-0 md:left-64 md:right-0 md:top-0 md:bottom-0 z-50 bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-border">
              <button 
                onClick={() => setIsDialogOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold">
                  {editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}
                </h1>
                <p className="text-sm text-muted-foreground">Configure os detalhes da recompensa</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <Label>Nome da recompensa *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Desconto de R$10"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Válido para pedidos acima de R$30"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pontos necessários *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.points_required}
                      onChange={(e) => setFormData({ ...formData, points_required: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Tipo de desconto</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(v) => setFormData({ ...formData, discount_type: v as 'fixed' | 'percent' })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                        <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valor do desconto * {formData.discount_type === 'fixed' ? '(R$)' : '(%)'}</Label>
                    {formData.discount_type === 'fixed' ? (
                      <CurrencyInput
                        value={formData.discount_value}
                        onChange={(value) => setFormData({ ...formData, discount_value: value })}
                        className="mt-1"
                      />
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                        className="mt-1"
                      />
                    )}
                  </div>

                  <div>
                    <Label>Pedido mínimo (R$)</Label>
                    <CurrencyInput
                      value={formData.min_order_value}
                      onChange={(value) => setFormData({ ...formData, min_order_value: value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Recompensa ativa</Label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
              <div className="max-w-2xl mx-auto flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveReward}
                  disabled={!formData.name || createReward.isPending || updateReward.isPending}
                >
                  {(createReward.isPending || updateReward.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingReward ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Reward Confirmation */}
      <DeleteConfirmationDialog
        open={!!deleteRewardData}
        onOpenChange={() => setDeleteRewardData(null)}
        onConfirm={handleConfirmDeleteReward}
        title="Excluir recompensa?"
        description={`Tem certeza que deseja excluir a recompensa "${deleteRewardData?.name}"? Esta ação não pode ser desfeita.`}
      />
    </AdminLayout>
  );
};

export default LoyaltyPage;

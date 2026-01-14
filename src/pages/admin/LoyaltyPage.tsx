import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Gift, Pencil, Trash2, Star, Users, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Programa de Fidelidade
                </CardTitle>
                <CardDescription>
                  Recompense seus clientes frequentes com pontos e descontos
                </CardDescription>
              </div>
              <Switch
                checked={settings?.loyalty_enabled || false}
                onCheckedChange={handleToggleLoyalty}
              />
            </div>
          </CardHeader>
          {settings?.loyalty_enabled && (
            <CardContent className="space-y-4">
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
            </CardContent>
          )}
        </Card>

        {/* Rewards List */}
        {settings?.loyalty_enabled && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Recompensas
                  </CardTitle>
                  <CardDescription>
                    Configure as recompensas que os clientes podem resgatar
                  </CardDescription>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Recompensa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reward Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? 'Editar Recompensa' : 'Nova Recompensa'}</DialogTitle>
            <DialogDescription>
              Configure os detalhes da recompensa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveReward}
              disabled={!formData.name || createReward.isPending || updateReward.isPending}
            >
              {editingReward ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

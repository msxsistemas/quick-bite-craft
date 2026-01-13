import { useState } from 'react';
import { Gift, Star, ChevronRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoyaltyReward, CustomerLoyalty } from '@/hooks/useLoyalty';
import { formatCurrency } from '@/lib/format';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface LoyaltyPointsDisplayProps {
  loyalty: CustomerLoyalty | null | undefined;
  rewards: LoyaltyReward[];
  onRedeemReward: (reward: LoyaltyReward) => Promise<void>;
  isRedeeming?: boolean;
  selectedRewardId?: string;
  orderTotal: number;
}

export const LoyaltyPointsDisplay = ({
  loyalty,
  rewards,
  onRedeemReward,
  isRedeeming,
  selectedRewardId,
  orderTotal,
}: LoyaltyPointsDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const points = loyalty?.total_points || 0;

  // Filter rewards that can be used with current order
  const availableRewards = rewards.filter(
    (r) => r.min_order_value <= orderTotal
  );

  if (!loyalty && rewards.length === 0) {
    return null;
  }

  const getProgressToNextReward = () => {
    if (availableRewards.length === 0) return null;
    
    const nextReward = availableRewards.find((r) => r.points_required > points);
    if (!nextReward) return null;
    
    const progress = (points / nextReward.points_required) * 100;
    return { reward: nextReward, progress: Math.min(progress, 100) };
  };

  const nextRewardProgress = getProgressToNextReward();

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-amber-700">Seus pontos</p>
            <p className="font-bold text-lg text-amber-900">{points} pts</p>
          </div>
        </div>
        
        {availableRewards.length > 0 && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Gift className="w-4 h-4 mr-1" />
                Resgatar
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Recompensas
                </SheetTitle>
                <SheetDescription>
                  Você tem <strong>{points} pontos</strong>. Escolha uma recompensa para resgatar.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(80vh-150px)]">
                {availableRewards.map((reward) => {
                  const canRedeem = points >= reward.points_required;
                  const isSelected = selectedRewardId === reward.id;

                  return (
                    <button
                      key={reward.id}
                      onClick={() => canRedeem && onRedeemReward(reward)}
                      disabled={!canRedeem || isRedeeming}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        canRedeem
                          ? isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{reward.name}</p>
                            {!canRedeem && (
                              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                                Faltam {reward.points_required - points} pts
                              </span>
                            )}
                          </div>
                          {reward.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {reward.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                              {reward.points_required} pontos
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {reward.discount_type === 'percent'
                                ? `${reward.discount_value}% de desconto`
                                : `${formatCurrency(reward.discount_value)} de desconto`}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          {isRedeeming && isSelected ? (
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          ) : canRedeem ? (
                            <ChevronRight className="w-5 h-5 text-primary" />
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {availableRewards.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma recompensa disponível no momento</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Progress to next reward */}
      {nextRewardProgress && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
            <span>Próxima recompensa</span>
            <span>{nextRewardProgress.reward.name}</span>
          </div>
          <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${nextRewardProgress.progress}%` }}
            />
          </div>
          <p className="text-xs text-amber-600 mt-1">
            {nextRewardProgress.reward.points_required - points} pontos para {nextRewardProgress.reward.name}
          </p>
        </div>
      )}

      {/* Info about earning points */}
      {!loyalty && (
        <p className="text-xs text-amber-600 mt-3">
          💡 Ganhe pontos a cada pedido e troque por descontos!
        </p>
      )}
    </div>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Progress } from '@shared/ui/progress';
import { Badge } from '@shared/ui/badge';
import { useTranslation } from 'react-i18next';
import { defaultCurrencyForLanguage, formatCurrency } from '@shared/i18n/locale';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Target, 
  TrendingDown, 
  DollarSign, 
  Droplets,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export function GoalsConfig() {
  const { t, i18n } = useTranslation();
  const currencyCode = defaultCurrencyForLanguage(i18n.resolvedLanguage || i18n.language);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [consumptionLimit, setConsumptionLimit] = useState(75);
  const [budgetLimit, setBudgetLimit] = useState(300000);
  const [waterRate, setWaterRate] = useState(3450);
  // RF30 - Configuración de metas
  const currentGoal = {
    type: 'consumption',
    limit: consumptionLimit,
    current: 52.3,
    unit: 'm³',
    period: 'mensual',
    percentage: 69.7
  };

  const budgetGoal = {
    type: 'cost',
    limit: budgetLimit,
    current: 270855,
    unit: currencyCode,
    period,
    percentage: 90.3
  };

  const handleUpdateConsumptionGoal = () => {
    toast.success(t('goals.goalUpdated'), {
      description: t('goals.newLimit', { limit: consumptionLimit, period: t(`reports.${period}`) })
    });
  };

  const handleUpdateBudgetGoal = () => {
    toast.success(t('goals.budgetUpdated'), {
      description: t('goals.budgetUpdatedDesc', {
        budget: formatCurrency(budgetLimit, i18n.language, currencyCode),
        rate: formatCurrency(waterRate, i18n.language, currencyCode)
      })
    });
  };

  return (
    <div className="space-y-6">
      {/* RF30 - Resumen de metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meta de consumo */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{t('goals.consumptionGoals')}</CardTitle>
                <CardDescription>{t('goals.monthlyWaterLimit')}</CardDescription>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Droplets className="size-6 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl">{currentGoal.current}</span>
                <span className="text-gray-600 mb-1">/ {currentGoal.limit} {currentGoal.unit}</span>
              </div>
              <Progress value={currentGoal.percentage} className="h-3" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">{t('goals.percentUsed', { percent: currentGoal.percentage.toFixed(1) })}</span>
                <Badge variant={currentGoal.percentage < 80 ? 'default' : 'destructive'}>
                  {currentGoal.percentage < 80 ? t('goals.onTrack') : t('goals.atRisk')}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="size-5" />
                <div>
                  <div className="text-sm">{t('goals.lessThanLastMonth', { percent: 30 })}</div>
                  <div className="text-xs text-gray-600">{t('goals.goodProgress')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta de presupuesto */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{t('goals.budgetGoals')}</CardTitle>
                <CardDescription>{t('goals.monthlySpendingLimit')}</CardDescription>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="size-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl">{formatCurrency(budgetGoal.current, i18n.language, currencyCode)}</span>
                <span className="text-gray-600 mb-1">/ {formatCurrency(budgetGoal.limit, i18n.language, currencyCode)}</span>
              </div>
              <Progress value={budgetGoal.percentage} className="h-3" />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-600">{t('goals.percentUsed', { percent: budgetGoal.percentage.toFixed(1) })}</span>
                <Badge variant="destructive">{t('goals.atRisk')}</Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertCircle className="size-5" />
                <div>
                  <div className="text-sm">{t('goals.remainingBudget', { amount: formatCurrency(budgetGoal.limit - budgetGoal.current, i18n.language, currencyCode) })}</div>
                  <div className="text-xs text-gray-600">{t('goals.considerReducingConsumption')}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RF30.1, RF30.4 - Configurar metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('goals.configureConsumptionGoal')}</CardTitle>
            <CardDescription>{t('goals.configureConsumptionGoalDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consumptionLimit">{t('goals.consumptionLimit')}</Label>
              <Input 
                id="consumptionLimit" 
                type="number" 
                value={consumptionLimit}
                onChange={(e) => setConsumptionLimit(Number(e.target.value))}
                placeholder="75"
              />
              <p className="text-xs text-gray-600">
                {t('goals.averageConsumptionHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t('reports.period')}</Label>
              <div className="mobile-inline-grid grid grid-cols-3 gap-2">
                <Button variant={period === 'daily' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('daily')}>{t('reports.daily')}</Button>
                <Button variant={period === 'weekly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('weekly')}>{t('reports.weekly')}</Button>
                <Button variant={period === 'monthly' ? 'default' : 'outline'} size="sm" onClick={() => setPeriod('monthly')}>{t('reports.monthly')}</Button>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-600">{t('goals.notifyAt')}</span>
                <span>80%</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-600">{t('goals.criticalAlertAt')}</span>
                <span>90%</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleUpdateConsumptionGoal}>{t('goals.updateGoal')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('goals.configureBudget')}</CardTitle>
            <CardDescription>{t('goals.configureBudgetDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="budgetLimit">{t('goals.monthlyBudget')}</Label>
              <Input 
                id="budgetLimit" 
                type="number" 
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(Number(e.target.value))}
                placeholder="300000"
              />
              <p className="text-xs text-gray-600">
                {t('goals.averageBillHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waterRate">{t('reports.waterRateCop')}</Label>
              <Input 
                id="waterRate" 
                type="number" 
                value={waterRate}
                onChange={(e) => setWaterRate(Number(e.target.value))}
                placeholder="3450"
              />
              <p className="text-xs text-gray-600">
                {t('goals.enterRateFromBill')}
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-600">{t('goals.notifyAt')}</span>
                <span>75%</span>
              </div>
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-gray-600">{t('goals.criticalAlertAt')}</span>
                <span>90%</span>
              </div>
            </div>

            <Button className="w-full" onClick={handleUpdateBudgetGoal}>{t('goals.updateBudget')}</Button>
          </CardContent>
        </Card>
      </div>

      {/* Historial de metas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('goals.goalsHistory')}</CardTitle>
          <CardDescription>{t('goals.goalsHistoryDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-600" />
                <div>
                  <div className="text-sm">{t('goals.monthGoal', { month: t('goals.months.september'), year: 2025 })}</div>
                  <div className="text-xs text-gray-600">{t('goals.goalHistoryDetail', { limit: 75, consumed: 68.5 })}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {t('goals.achieved')}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-green-600" />
                <div>
                  <div className="text-sm">{t('goals.monthGoal', { month: t('goals.months.august'), year: 2025 })}</div>
                  <div className="text-xs text-gray-600">{t('goals.goalHistoryDetail', { limit: 80, consumed: 72.3 })}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {t('goals.achieved')}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="size-5 text-orange-600" />
                <div>
                  <div className="text-sm">{t('goals.monthGoal', { month: t('goals.months.july'), year: 2025 })}</div>
                  <div className="text-xs text-gray-600">{t('goals.goalHistoryDetail', { limit: 75, consumed: 82.1 })}</div>
                </div>
              </div>
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                {t('goals.notAchieved')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RF30.2 - Progreso visual */}
      <Card>
        <CardHeader>
          <CardTitle>{t('goals.monthProjection')}</CardTitle>
          <CardDescription>{t('goals.monthProjectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Calendar className="size-6 text-blue-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">{t('goals.elapsedDays')}</div>
                <div className="text-2xl mt-1">24 / 30</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Target className="size-6 text-green-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">{t('goals.finalProjection')}</div>
                <div className="text-2xl mt-1">65.4 m³</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <TrendingDown className="size-6 text-purple-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600">{t('goals.projectedSavings')}</div>
                <div className="text-2xl mt-1">12.8%</div>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm">{t('goals.excellentProgress')}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('goals.excellentProgressDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

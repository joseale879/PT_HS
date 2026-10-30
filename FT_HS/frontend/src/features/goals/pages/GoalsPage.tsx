import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { Droplets, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { goalsApi, consumptionApi, type BudgetStatus } from '@shared/http/httpClient';
import { localDate } from '@shared/lib/dates';

type Goal = {
  goalId: string;
  type: string;
  targetM3: number;
  targetBudget?: number | null;
  periodStart: string;
  periodEnd?: string | null;
  achieved?: boolean;
};

type GoalPeriod = 'daily' | 'weekly' | 'monthly';

type BudgetAllowance = {
  remainingBudget: number;
  remainingLiters: number;
  monthlyLiters: number;
  dailyLiters: number;
  weeklyLiters: number;
};

function calculateBudgetAllowance(
  budgetValue: string,
  status: BudgetStatus | null
): BudgetAllowance | null {
  const budget = Number(budgetValue);
  const tariff = Number(status?.tariffM3 || 0);
  if (!budgetValue.trim() || !Number.isFinite(budget) || budget < 0 || tariff <= 0 || !status) {
    return null;
  }

  const remainingBudget = Math.max(budget - Number(status.currentCost || 0), 0);
  const remainingLiters = (remainingBudget / tariff) * 1000;
  const remainingDays = Math.max(status.daysInMonth - status.dayOfMonth + 1, 1);
  const dailyLiters = remainingLiters / remainingDays;
  return {
    remainingBudget,
    remainingLiters,
    monthlyLiters: remainingLiters,
    dailyLiters,
    weeklyLiters: Math.min(remainingLiters, dailyLiters * 7),
  };
}

function getPeriodLiters(
  selectedPeriod: GoalPeriod,
  allowance: BudgetAllowance | null,
  status: BudgetStatus | null
) {
  if (allowance) return allowance[`${selectedPeriod}Liters`];
  if (!status) return 0;
  if (selectedPeriod === 'daily') return status.expectedDailyLiters;
  if (selectedPeriod === 'weekly') return status.expectedWeeklyLiters;
  return status.expectedMonthlyLiters;
}

function toM3Input(liters: number) {
  return String(Number((liters / 1000).toFixed(4)));
}

export function GoalsConfig({ homeId }: { homeId?: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressByGoal, setProgressByGoal] = useState<Record<string, number>>({});
  const [consumption, setConsumption] = useState(0);
  const [consumptionLimit, setConsumptionLimit] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [period, setPeriod] = useState<GoalPeriod>('monthly');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!homeId) return;
    const now = new Date();
    const from = localDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const to = localDate(now);
    try {
      const [goalResponse, summaryResponse, budgetResponse] = await Promise.all([
        goalsApi.list(homeId),
        consumptionApi.summary(new URLSearchParams({ homeId, from, to }).toString()),
        consumptionApi.budgetStatus(new URLSearchParams({ homeId }).toString()),
      ]);
      const loaded = goalResponse.data as Goal[];
      const progressResponses = await Promise.all(
        loaded.map((goal) => goalsApi.progress(goal.goalId).catch(() => null))
      );
      const nextProgress: Record<string, number> = {};
      progressResponses.forEach((response, index) => {
        const progress = Number((response?.data as { progress?: number } | undefined)?.progress);
        if (Number.isFinite(progress)) nextProgress[loaded[index].goalId] = progress;
      });

      const today = localDate(new Date());
      const isCurrentGoal = (goal: Goal) =>
        goal.periodStart.slice(0, 10) <= today &&
        (!goal.periodEnd || goal.periodEnd.slice(0, 10) >= today);
      const active = loaded.find(
        (goal) =>
          ['daily', 'weekly', 'monthly'].includes(goal.type) && isCurrentGoal(goal)
      );
      const activePeriod: GoalPeriod =
        active?.type === 'daily' || active?.type === 'weekly' ? active.type : 'monthly';
      const activeMonthly = loaded.find(
        (goal) => goal.type === 'monthly' && isCurrentGoal(goal)
      );
      const currentBudget =
        budgetResponse.data?.monthlyBudget ?? activeMonthly?.targetBudget ?? null;
      const budgetValue = currentBudget == null ? '' : String(currentBudget);
      const loadedAllowance = calculateBudgetAllowance(budgetValue, budgetResponse.data);

      setGoals(loaded);
      setProgressByGoal(nextProgress);
      setConsumption(Number(summaryResponse.data.totalM3 || 0));
      setBudgetStatus(budgetResponse.data);
      setPeriod(activePeriod);
      setBudgetLimit(budgetValue);
      setConsumptionLimit(
        active
          ? String(active.targetM3)
          : toM3Input(getPeriodLiters(activePeriod, loadedAllowance, budgetResponse.data))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las metas');
    }
  };

  useEffect(() => {
    void load();
  }, [homeId]);

  const budgetAllowance = calculateBudgetAllowance(budgetLimit, budgetStatus);
  const referenceDailyLiters =
    budgetAllowance?.dailyLiters ?? budgetStatus?.expectedDailyLiters ?? 0;
  const referenceWeeklyLiters =
    budgetAllowance?.weeklyLiters ?? budgetStatus?.expectedWeeklyLiters ?? 0;
  const referenceMonthlyLiters =
    budgetAllowance?.monthlyLiters ?? budgetStatus?.expectedMonthlyLiters ?? 0;

  const selectPeriod = (nextPeriod: GoalPeriod) => {
    setPeriod(nextPeriod);
    setConsumptionLimit(toM3Input(getPeriodLiters(nextPeriod, budgetAllowance, budgetStatus)));
  };

  const updateBudget = (value: string) => {
    setBudgetLimit(value);
    const nextAllowance = calculateBudgetAllowance(value, budgetStatus);
    setConsumptionLimit(toM3Input(getPeriodLiters(period, nextAllowance, budgetStatus)));
  };

  const save = async () => {
    const targetM3 = Number(consumptionLimit);
    if (!homeId || !consumptionLimit.trim() || !Number.isFinite(targetM3) || targetM3 < 0) {
      toast.error('Ingresa un límite de consumo válido');
      return;
    }
    const requestedBudget = budgetLimit.trim() ? Number(budgetLimit) : null;
    if (requestedBudget != null && (!Number.isFinite(requestedBudget) || requestedBudget < 0)) {
      toast.error('Ingresa un presupuesto válido');
      return;
    }
    const date = new Date();
    const formatDate = (value: Date) => {
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${value.getFullYear()}-${month}-${day}`;
    };
    const periodStart = formatDate(date);
    const monthStartDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEndDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const periodEndDate = new Date(date);
    if (period === 'weekly') {
      periodEndDate.setDate(Math.min(date.getDate() + 6, monthEndDate.getDate()));
    }
    if (period === 'monthly') periodEndDate.setTime(monthEndDate.getTime());
    const periodEnd = formatDate(periodEndDate);
    const monthStart = formatDate(monthStartDate);
    const monthEnd = formatDate(monthEndDate);
    const monthlyTargetM3 =
      (budgetAllowance?.monthlyLiters ?? budgetStatus?.expectedMonthlyLiters ?? 0) / 1000;
    const payload = {
      homeId,
      type: period,
      targetM3,
      targetBudget: requestedBudget,
      periodStart,
      periodEnd,
      monthlyTargetM3,
      monthStart,
      monthEnd,
    };
    try {
      setSaving(true);
      await goalsApi.savePlan(payload);
      toast.success('Meta guardada correctamente');
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la meta');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (goalId: string) => {
    try {
      await goalsApi.remove(goalId);
      setGoals((current) => current.filter((goal) => goal.goalId !== goalId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la meta');
    }
  };

  return (
    <div className="goals-config space-y-6">
      <div>
        <h2 className="text-2xl">Metas de consumo</h2>
        <p className="text-gray-600">
          Configura límites persistidos en el backend para el hogar seleccionado.
        </p>
      </div>
      {budgetStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Referencia del hogar</CardTitle>
            <CardDescription>
              {budgetAllowance
                ? 'Calculada según el presupuesto, la tarifa y los días restantes del mes.'
                : `Calculada con ${budgetStatus.peopleCount} persona(s), ${budgetStatus.daysInMonth} días del mes y ${budgetStatus.referenceSource === 'HOME_HISTORY' ? `${budgetStatus.historyDays} días de historial propio.` : 'la referencia inicial.'}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Referencia diaria</p>
              <p className="text-xl">{referenceDailyLiters.toFixed(0)} L</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Referencia semanal</p>
              <p className="text-xl">{referenceWeeklyLiters.toFixed(0)} L</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Referencia mensual</p>
              <p className="text-xl">{(referenceMonthlyLiters / 1000).toFixed(2)} m³</p>
            </div>
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>
              <Droplets className="mr-2 inline size-5 text-blue-600" />
              Límite de consumo
            </CardTitle>
            <CardDescription>Consumo del periodo actual: {consumption} m³</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="goal-m3">Meta en m³</Label>
            <Input
              id="goal-m3"
              type="number"
              min="0"
              value={consumptionLimit}
              onChange={(event) => setConsumptionLimit(event.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant={period === 'daily' ? 'default' : 'outline'}
                onClick={() => selectPeriod('daily')}
              >
                Diario
              </Button>
              <Button
                variant={period === 'weekly' ? 'default' : 'outline'}
                onClick={() => selectPeriod('weekly')}
              >
                Semanal
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                onClick={() => selectPeriod('monthly')}
              >
                Mensual
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
          <CardDescription>Presupuesto mensual para calcular el consumo disponible.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="goal-budget">Límite monetario</Label>
            <Input
              id="goal-budget"
              type="number"
              min="0"
              value={budgetLimit}
              onChange={(event) => updateBudget(event.target.value)}
            />
            <Button className="w-full" onClick={save} disabled={saving || !homeId}>
              {saving ? 'Guardando…' : 'Guardar meta'}
            </Button>
            {budgetStatus && (
              <div className="space-y-1 rounded-lg border bg-gray-50 p-3 text-sm">
                <p>
                  Tarifa de referencia:{' '}
                  <strong>${budgetStatus.tariffM3.toLocaleString('es-CO')} / m³</strong>
                </p>
                <p>
                  Costo estimado del mes:{' '}
                  <strong>${budgetStatus.currentCost.toLocaleString('es-CO')}</strong>
                </p>
                <p>
                  Litros restantes segun presupuesto:{' '}
                  <strong>
                    {budgetAllowance
                      ? `${budgetAllowance.remainingLiters.toFixed(0)} L`
                      : budgetLimit.trim()
                        ? budgetStatus.tariffM3 > 0
                          ? 'Calculando…'
                          : 'No hay tarifa vigente'
                        : 'Configura un presupuesto'}
                  </strong>
                </p>
                <p className="text-xs text-gray-500">
                  El costo no representa la factura final del prestador.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Metas registradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goals.length ? (
            goals.map((goal) => {
              const progress = progressByGoal[goal.goalId];
              return (
                <div key={goal.goalId} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{goal.type}</p>
                      <p className="text-sm text-gray-600">
                        {goal.targetM3} m³ · desde {goal.periodStart}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={goal.achieved ? 'default' : 'outline'}>
                        {goal.achieved
                          ? 'Lograda'
                          : progress === undefined
                            ? '—'
                            : `${progress.toFixed(1)}%`}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(goal.goalId)}
                        aria-label="Eliminar meta"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={progress ?? 0} className="mt-3" />
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">
              <Target className="mr-2 inline size-4" />
              No hay metas registradas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

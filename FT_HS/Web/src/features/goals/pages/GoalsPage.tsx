import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Badge } from '@shared/ui/badge';
import { Progress } from '@shared/ui/progress';
import { Droplets, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { goalsApi, consumptionApi } from '@shared/http/httpClient';

type Goal = {
  goalId: string;
  type: string;
  targetM3: number;
  targetBudget?: number | null;
  periodStart: string;
  periodEnd?: string | null;
  achieved?: boolean;
};

export function GoalsConfig({ homeId }: { homeId?: string }) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [consumption, setConsumption] = useState(0);
  const [consumptionLimit, setConsumptionLimit] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'annual'>('monthly');

  const load = () => {
    if (!homeId) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    Promise.all([
      goalsApi.list(homeId),
      consumptionApi.summary(new URLSearchParams({ homeId, from, to }).toString()),
    ])
      .then(([goalResponse, summaryResponse]) => {
        const loaded = goalResponse.data as Goal[];
        const active = loaded.find((goal) => goal.type === 'monthly') || loaded[0];
        setGoals(loaded);
        setConsumption(Number((summaryResponse.data as any)?.totalM3 || 0));
        setConsumptionLimit(active ? String(active.targetM3) : '');
        setBudgetLimit(active?.targetBudget != null ? String(active.targetBudget) : '');
        setPeriod(active?.type === 'weekly' || active?.type === 'annual' ? active.type : 'monthly');
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las metas')
      );
  };

  useEffect(load, [homeId]);

  const save = async () => {
    if (!homeId || Number(consumptionLimit) <= 0) {
      toast.error('El límite de consumo debe ser mayor que cero');
      return;
    }
    const date = new Date();
    const periodStart = date.toISOString().slice(0, 10);
    const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate())
      .toISOString()
      .slice(0, 10);
    const existing = goals.find((goal) => goal.type === period);
    const payload = {
      type: period,
      targetM3: Number(consumptionLimit),
      targetBudget: budgetLimit ? Number(budgetLimit) : null,
      periodStart,
      periodEnd,
    };
    try {
      if (existing) await goalsApi.update(existing.goalId, payload);
      else await goalsApi.create({ homeId, ...payload });
      toast.success('Meta guardada correctamente');
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la meta');
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Metas de consumo</h2>
        <p className="text-gray-600">
          Configura límites persistidos en el backend para el hogar seleccionado.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
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
                variant={period === 'weekly' ? 'default' : 'outline'}
                onClick={() => setPeriod('weekly')}
              >
                Semanal
              </Button>
              <Button
                variant={period === 'monthly' ? 'default' : 'outline'}
                onClick={() => setPeriod('monthly')}
              >
                Mensual
              </Button>
              <Button
                variant={period === 'annual' ? 'default' : 'outline'}
                onClick={() => setPeriod('annual')}
              >
                Anual
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Presupuesto</CardTitle>
            <CardDescription>Opcional, asociado a la misma meta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="goal-budget">Límite monetario</Label>
            <Input
              id="goal-budget"
              type="number"
              min="0"
              value={budgetLimit}
              onChange={(event) => setBudgetLimit(event.target.value)}
            />
            <Button className="w-full" onClick={save}>
              Guardar meta
            </Button>
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
              const progress = goal.targetM3
                ? Math.min((consumption / goal.targetM3) * 100, 100)
                : 0;
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
                        {goal.achieved ? 'Lograda' : `${progress.toFixed(1)}%`}
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
                  <Progress value={progress} className="mt-3" />
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

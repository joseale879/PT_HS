import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, CalendarDays, Droplets, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import {
  consumptionApi,
  type ConsumptionSummary,
  type HourlyConsumption,
} from '@shared/http/apiClient';
import { DailyConsumptionChart } from '@features/consumption/charts/DailyConsumptionChart';
import { WeeklyConsumptionChart } from '@features/consumption/charts/WeeklyConsumptionChart';

type DailyPoint = { day: string; consumption: number };

function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function query(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

export function ConsumptionPage({ homeId }: { homeId?: string }) {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(localDate(new Date()));
  const [summary, setSummary] = useState<ConsumptionSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyConsumption[]>([]);
  const [weekly, setWeekly] = useState<DailyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const range = useMemo(() => {
    const end = new Date(`${selectedDate}T12:00:00`);
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6, 12);
    return { from: localDate(start), to: selectedDate };
  }, [selectedDate]);

  const load = async () => {
    if (!homeId) return;
    setLoading(true);
    setError(false);
    try {
      const dates = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(`${selectedDate}T12:00:00`);
        date.setDate(date.getDate() - (6 - index));
        return date;
      });
      const [summaryResponse, hourlyResponse, dailyResponses] = await Promise.all([
        consumptionApi.summary(query({ homeId, from: range.from, to: range.to })),
        consumptionApi.hourly(query({ homeId })),
        Promise.all(
          dates.map((date) => consumptionApi.daily(query({ homeId, date: localDate(date) })))
        ),
      ]);
      setSummary(summaryResponse.data);
      setHourly(hourlyResponse.data.points || []);
      setWeekly(
        dailyResponses.map((response, index) => ({
          day: dates[index].toLocaleDateString(i18n.language, { weekday: 'short' }),
          consumption: Number(response.data.consumptionLiters || 0) / 1000,
        }))
      );
    } catch (loadError) {
      setSummary(null);
      setHourly([]);
      setWeekly([]);
      setError(true);
      toast.error(loadError instanceof Error ? loadError.message : t('consumption.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [homeId, selectedDate, i18n.language]);

  if (!homeId) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-gray-600">
          {t('consumption.selectHome')}
        </CardContent>
      </Card>
    );
  }

  const totalM3 = Number(summary?.totalM3 || 0);
  const totalLiters = Number(summary?.totalLiters || 0);
  const readingCount = Number(summary?.readingCount || 0);
  const cost = summary?.totalCost;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">{t('consumption.title')}</h2>
          <p className="text-gray-600">{t('consumption.subtitle')}</p>
        </div>
        <div className="flex items-end gap-2">
          <label className="grid gap-1 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <CalendarDays className="size-4" />
              {t('consumption.endDate')}
            </span>
            <input
              className="h-10 rounded-md border px-3"
              type="date"
              value={selectedDate}
              max={localDate(new Date())}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
            aria-label={t('consumption.refresh')}
          >
            <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {t('consumption.loadError')}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t('consumption.periodTotal')}</CardDescription>
            <CardTitle>{loading ? '—' : `${totalM3.toFixed(2)} m³`}</CardTitle>
          </CardHeader>
          <CardContent>
            <Droplets className="size-5 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('consumption.liters')}</CardDescription>
            <CardTitle>{loading ? '—' : `${totalLiters.toFixed(1)} L`}</CardTitle>
          </CardHeader>
          <CardContent>
            <Droplets className="size-5 text-cyan-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('consumption.readings')}</CardDescription>
            <CardTitle>{loading ? '—' : readingCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Activity className="size-5 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('consumption.cost')}</CardDescription>
            <CardTitle>{loading || cost == null ? '—' : `$${Number(cost).toFixed(2)}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{t('consumption.backendCalculated')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('consumption.hourlyTitle')}</CardTitle>
            <CardDescription>{t('consumption.hourlyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[290px]">
            {hourly.length ? (
              <DailyConsumptionChart points={hourly} />
            ) : (
              <p className="py-8 text-sm text-gray-500">{t('consumption.noData')}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('consumption.dailyTitle')}</CardTitle>
            <CardDescription>{t('consumption.dailyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[290px]">
            {weekly.length ? (
              <WeeklyConsumptionChart points={weekly} />
            ) : (
              <p className="py-8 text-sm text-gray-500">{t('consumption.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

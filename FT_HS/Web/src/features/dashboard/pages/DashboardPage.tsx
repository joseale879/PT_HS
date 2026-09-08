import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import {
  Droplets,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Battery,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { DailyConsumptionChart } from '@features/consumption/charts/DailyConsumptionChart';
import { WeeklyConsumptionChart } from '@features/consumption/charts/WeeklyConsumptionChart';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { alertsApi, consumptionApi, devicesApi } from '@shared/http/httpClient';

interface DashboardHomeProps {
  homeId?: string;
}

// RNF1.2 - Tiempos de respuesta menores a 3 segundos
// RNF4.3 - Notificaciones en tiempo real
// RF14 - Monitoreo en tiempo real
export function DashboardHome({ homeId }: DashboardHomeProps) {
  const { t } = useTranslation();
  const [currentConsumption, setCurrentConsumption] = useState({
    today: 0,
    week: 0,
    month: 0,
    realTime: 0,
  });
  const [devices, setDevices] = useState<
    Array<{ id: string; name: string; status: string; lastConnectionAt?: string }>
  >([]);
  const [alerts, setAlerts] = useState<
    Array<{ id: string; type: string; message: string; time: string }>
  >([]);
  const [pendingAlertCount, setPendingAlertCount] = useState(0);
  const [hourlyPoints, setHourlyPoints] = useState<
    Array<{ hour: number; averageConsumptionM3: number }>
  >([]);
  const [weeklyPoints, setWeeklyPoints] = useState<Array<{ day: string; consumption: number }>>([]);
  const [comparisons, setComparisons] = useState<{ today: number | null; week: number | null }>({
    today: null,
    week: null,
  });
  const [monthlyProjection, setMonthlyProjection] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    if (!homeId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setHasLoadError(false);
    const now = new Date();
    const iso = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const previousWeekStart = new Date(weekStart);
    previousWeekStart.setDate(weekStart.getDate() - 7);
    const previousWeekEnd = new Date(now);
    previousWeekEnd.setDate(now.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const elapsedMonthDays = now.getDate();
    const monthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      return date;
    });
    Promise.all([
      consumptionApi.summary(
        new URLSearchParams({ homeId, from: iso(now), to: iso(now) }).toString()
      ),
      consumptionApi.summary(
        new URLSearchParams({ homeId, from: iso(weekStart), to: iso(now) }).toString()
      ),
      consumptionApi.summary(
        new URLSearchParams({ homeId, from: iso(monthStart), to: iso(now) }).toString()
      ),
      consumptionApi.summary(
        new URLSearchParams({ homeId, from: iso(yesterday), to: iso(yesterday) }).toString()
      ),
      consumptionApi.summary(
        new URLSearchParams({ homeId, from: iso(previousWeekStart), to: iso(previousWeekEnd) }).toString()
      ),
      consumptionApi.hourly(new URLSearchParams({ homeId }).toString()),
      devicesApi.list(homeId),
      alertsApi.pending(homeId),
      Promise.all(
        days.map((date) =>
          consumptionApi.daily(new URLSearchParams({ homeId, date: iso(date) }).toString())
        )
      ),
    ])
      .then(
        ([
          today,
          week,
          month,
          yesterdayResponse,
          previousWeekResponse,
          hourly,
          deviceResponse,
          alertResponse,
          dailyResponses,
        ]) => {
          const getTotal = (response: { data: unknown }) =>
            Number((response.data as { totalM3?: number }).totalM3 || 0);
          const todayTotal = getTotal(today);
          const weekTotal = getTotal(week);
          const monthTotal = getTotal(month);
          const yesterdayTotal = getTotal(yesterdayResponse);
          const previousWeekTotal = getTotal(previousWeekResponse);
          const percentageChange = (current: number, previous: number) =>
            previous > 0 ? ((current - previous) / previous) * 100 : null;
        const hourData =
          (hourly.data as { points?: Array<{ hour: number; averageConsumptionM3: number }> })
            .points || [];
        setHourlyPoints(hourData);
        setCurrentConsumption({
          today: todayTotal,
          week: weekTotal,
          month: monthTotal,
          realTime: Number(hourData.at(-1)?.averageConsumptionM3 || 0),
        });
        setComparisons({
          today: percentageChange(todayTotal, yesterdayTotal),
          week: percentageChange(weekTotal, previousWeekTotal),
        });
        setMonthlyProjection(
          elapsedMonthDays > 0 ? (monthTotal / elapsedMonthDays) * monthDays : null
        );
        setWeeklyPoints(
          dailyResponses.map((response, index) => ({
            day: days[index].toLocaleDateString(undefined, { weekday: 'short' }),
            consumption:
              Number((response.data as { consumptionLiters?: number }).consumptionLiters || 0) /
              1000,
          }))
        );
        setDevices(
          (
            (deviceResponse.data as Array<{
              deviceId: string;
              name: string;
              status: string;
              lastConnectionAt?: string;
            }>) || []
          ).map((device) => ({
            id: device.deviceId,
            name: device.name,
            status: device.status === 'Active' ? 'online' : 'offline',
            lastConnectionAt: device.lastConnectionAt,
          }))
        );
        const pending = alertResponse.data as {
          pendingCount?: number;
          lastAlertAt?: string | null;
        };
        const count = Number(pending.pendingCount || 0);
        setPendingAlertCount(count);
        setAlerts(
          count > 0
            ? [
                {
                  id: `pending-${homeId}`,
                  type: 'warning',
                  message: `${count} ${t('dashboard.activeAlerts')}`,
                  time: pending.lastAlertAt ? new Date(pending.lastAlertAt).toLocaleString() : '',
                },
              ]
            : []
        );
        }
      )
      .catch(() => {
        setCurrentConsumption({ today: 0, week: 0, month: 0, realTime: 0 });
        setComparisons({ today: null, week: null });
        setMonthlyProjection(null);
        setDevices([]);
        setAlerts([]);
        setPendingAlertCount(0);
        setHourlyPoints([]);
        setWeeklyPoints([]);
        setHasLoadError(true);
      })
      .finally(() => setIsLoading(false));
  }, [homeId, t]);

  const MetricValue = ({ value }: { value: number }) =>
    isLoading || hasLoadError ? '—' : `${value.toFixed(2)} m³`;

  const Comparison = ({ value }: { value: number | null }) => {
    if (isLoading || hasLoadError || value === null) {
      return <span className="text-sm text-gray-600">{t('dashboard.noComparableData')}</span>;
    }
    const isDecrease = value <= 0;
    const TrendIcon = isDecrease ? TrendingDown : TrendingUp;
    return (
      <div className={`flex items-center gap-2 ${isDecrease ? 'text-green-600' : 'text-red-600'}`}>
        <TrendIcon className="size-4" aria-hidden="true" />
        <span className="text-sm">
          {Math.abs(value).toFixed(1)}%{' '}
          {isDecrease
            ? t('dashboard.lessThanPreviousPeriod')
            : t('dashboard.moreThanPreviousPeriod')}
        </span>
      </div>
    );
  };

  return (
    <div className="min-w-0 space-y-7 lg:space-y-8">
      {/* RNF2.2 - Tarjetas de resumen con información clara */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>{t('dashboard.todayConsumption')}</CardDescription>
            <CardTitle className="text-2xl lg:text-3xl"><MetricValue value={currentConsumption.today} /></CardTitle>
          </CardHeader>
          <CardContent>
            <Comparison value={comparisons.today} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>{t('dashboard.weekConsumption')}</CardDescription>
            <CardTitle className="text-2xl lg:text-3xl"><MetricValue value={currentConsumption.week} /></CardTitle>
          </CardHeader>
          <CardContent>
            <Comparison value={comparisons.week} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>{t('dashboard.monthConsumption')}</CardDescription>
            <CardTitle className="text-2xl lg:text-3xl"><MetricValue value={currentConsumption.month} /></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {isLoading || hasLoadError || monthlyProjection === null
                ? t('dashboard.noComparableData')
                : t('dashboard.monthlyProjectionValue', { value: monthlyProjection.toFixed(2) })}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardDescription>{t('dashboard.currentFlow')}</CardDescription>
            <CardTitle className="text-2xl lg:text-3xl flex items-center gap-2">
              <Activity className="size-6 text-blue-600 animate-pulse" aria-hidden="true" />
              {currentConsumption.realTime}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">{t('dashboard.realTimeFlow')}</div>
          </CardContent>
        </Card>
      </div>

      {/* RF18 - Alertas y notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>{t('dashboard.activeAlerts')}</CardTitle>
              <CardDescription>{t('dashboard.importantSystemNotifications')}</CardDescription>
            </div>
            <Badge variant="destructive" className="h-auto w-fit whitespace-normal">
              {pendingAlertCount} {t('dashboard.activeAlerts')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 sm:p-4 rounded-lg border ${
                  alert.type === 'warning'
                    ? 'bg-orange-50 border-orange-200'
                    : alert.type === 'info'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-green-50 border-green-200'
                }`}
                role="alert"
                aria-live="polite"
              >
                {alert.type === 'warning' && (
                  <AlertTriangle
                    className="size-5 text-orange-600 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {alert.type === 'info' && (
                  <Battery
                    className="size-5 text-blue-600 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {alert.type === 'success' && (
                  <CheckCircle2
                    className="size-5 text-green-600 mt-0.5 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm break-words">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard.ago')} {alert.time}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  aria-label={t('dashboard.viewDetails')}
                >
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RF22 - Gráficos de consumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.dailyConsumption')}</CardTitle>
            <CardDescription>{t('dashboard.waterConsumptionPerHour')}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="h-64 min-w-0 lg:h-80">
              <DailyConsumptionChart points={hourlyPoints} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.weeklyConsumption')}</CardTitle>
            <CardDescription>{t('dashboard.waterConsumptionPerDay')}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="h-64 min-w-0 lg:h-80">
              <WeeklyConsumptionChart points={weeklyPoints} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RF14 - Estado de dispositivos */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.iotDeviceStatus')}</CardTitle>
          <CardDescription>{t('dashboard.realTimeMonitoring')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Droplets className="size-4 text-blue-600 flex-shrink-0" aria-hidden="true" />
                      <span className="text-sm truncate">{device.name}</span>
                    </div>
                  </div>
                  <Badge
                    variant={device.status === 'online' ? 'default' : 'destructive'}
                    className="flex-shrink-0"
                  >
                    {device.status === 'online' ? (
                      <>
                        <Wifi className="size-3 mr-1" aria-hidden="true" /> {t('dashboard.online')}
                      </>
                    ) : (
                      <>
                        <WifiOff className="size-3 mr-1" aria-hidden="true" />{' '}
                        {t('dashboard.offline')}
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Última conexión</span>
                  <span>
                    {device.lastConnectionAt
                      ? new Date(device.lastConnectionAt).toLocaleString()
                      : 'Sin registro'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

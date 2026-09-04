import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { alertsApi } from '@shared/http/httpClient';
import { toast } from 'sonner';

type AlertEvent = {
  alertId: string;
  message?: string;
  detectedValue?: number | null;
  generatedAt: string;
  status: string;
};
export function NotificationsPanel({ homeId }: { homeId?: string }) {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [thresholds, setThresholds] = useState<any>(null);
  const load = () => {
    if (!homeId) return Promise.resolve();
    return Promise.all([alertsApi.history(homeId, 'pageSize=100'), alertsApi.thresholds(homeId)])
      .then(([history, threshold]) => {
        setAlerts(history.data as AlertEvent[]);
        setThresholds(threshold.data);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las alertas')
      );
  };
  useEffect(() => {
    load();
  }, [homeId]);
  const mark = async (alertId: string, status: 'Read' | 'Dismissed') => {
    try {
      await alertsApi.updateStatus(alertId, status);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la alerta');
    }
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Bell className="mr-2 inline size-5" />
            Alertas
          </CardTitle>
          <CardDescription>Historial y configuración consultados desde el backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl">
                {alerts.filter((alert) => alert.status === 'Pending').length}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Límite diario</p>
              <p className="text-2xl">{thresholds?.dailyLimit ?? '—'}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-600">Límite mensual</p>
              <p className="text-2xl">{thresholds?.monthlyLimit ?? '—'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length ? (
            alerts.map((alert) => (
              <div
                key={alert.alertId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-1 size-5 text-orange-600" />
                  <div>
                    <p className="font-medium">{alert.message || 'Alerta sin descripción'}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(alert.generatedAt).toLocaleString('es-CO')} · valor:{' '}
                      {alert.detectedValue ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{alert.status}</Badge>
                  {alert.status === 'Pending' && (
                    <>
                      <Button size="sm" onClick={() => mark(alert.alertId, 'Read')}>
                        <CheckCircle2 className="mr-1 size-4" />
                        Leer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => mark(alert.alertId, 'Dismissed')}
                      >
                        Descartar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay alertas para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Download, FileSpreadsheet, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { consumptionApi, homesApi, tariffApi } from '@shared/http/httpClient';

type Home = { id: string; name: string; tier?: number | null };
type ReportData = { totalM3?: number; totalCost?: number; readingCount?: number };

export function ReportsAnalytics({ homeId }: { homeId?: string }) {
  const { t } = useTranslation();
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState(homeId || '');
  const [summary, setSummary] = useState<ReportData>({});
  const [tariff, setTariff] = useState<{ m3Value?: number; fixedCharge?: number } | null>(null);
  const [monthly, setMonthly] = useState<Array<{ month: string; liters: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    homesApi
      .list()
      .then(({ data }) => {
        const loaded = (data as any[]).map((home) => ({
          id: String(home.homeId),
          name: String(home.name),
          tier: home.tier,
        }));
        setHomes(loaded);
        setSelectedHomeId((current) => current || loaded[0]?.id || '');
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los hogares')
      );
  }, []);

  useEffect(() => {
    if (homeId) setSelectedHomeId(homeId);
  }, [homeId]);

  useEffect(() => {
    if (!selectedHomeId) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    setLoading(true);
    Promise.all([
      consumptionApi.summary(new URLSearchParams({ homeId: selectedHomeId, from, to }).toString()),
      tariffApi.currentByHome(selectedHomeId).catch(() => ({ data: null })),
      Promise.all(
        Array.from({ length: 6 }, (_, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          return consumptionApi.monthly(
            new URLSearchParams({
              homeId: selectedHomeId,
              year: String(date.getFullYear()),
              month: String(date.getMonth() + 1),
            }).toString()
          );
        })
      ),
    ])
      .then(([summaryResponse, tariffResponse, monthlyResponses]) => {
        setSummary(summaryResponse.data as ReportData);
        setTariff(tariffResponse.data as { m3Value?: number; fixedCharge?: number } | null);
        setMonthly(
          monthlyResponses.map((response, index) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
            return {
              month: date.toLocaleDateString(undefined, { month: 'short' }),
              liters: Number((response.data as any)?.consumptionLiters || 0),
            };
          })
        );
      })
      .catch((error) => {
        setSummary({});
        setTariff(null);
        setMonthly([]);
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los reportes');
      })
      .finally(() => setLoading(false));
  }, [selectedHomeId]);

  const currentM3 = Number(summary.totalM3 || 0);
  const currentCost = Number(summary.totalCost || 0);
  const rate = Number(tariff?.m3Value || 0);
  const selectedHome = useMemo(
    () => homes.find((home) => home.id === selectedHomeId),
    [homes, selectedHomeId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl text-gray-900">{t('reports.title')}</h2>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
        <select
          className="h-10 rounded-md border px-3"
          value={selectedHomeId}
          onChange={(event) => setSelectedHomeId(event.target.value)}
          aria-label={t('homes.home')}
        >
          <option value="">{t('homes.selectHome')}</option>
          {homes.map((home) => (
            <option key={home.id} value={home.id}>
              {home.name}
            </option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.generateReport')}</CardTitle>
          <CardDescription>{selectedHome?.name || t('homes.home')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() =>
                toast.info('La exportación se habilitará cuando exista el endpoint de reportes.')
              }
            >
              <Download className="size-4" /> {t('reports.exportAsPDF')}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.info('La exportación se habilitará cuando exista el endpoint de reportes.')
              }
            >
              <FileSpreadsheet className="size-4" /> {t('reports.exportAsExcel')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.currentConsumption')}</CardDescription>
            <CardTitle>{loading ? '…' : `${currentM3} m³`}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {summary.readingCount || 0} lecturas registradas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.monthProjection')}</CardDescription>
            <CardTitle>{currentCost ? `$${currentCost}` : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Costo calculado por el backend</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.waterRate')}</CardDescription>
            <CardTitle>{rate ? `$${rate}` : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {tariff?.fixedCharge ? `Cargo fijo: $${tariff.fixedCharge}` : 'Sin tarifa vigente'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.historicalComparison')}</CardTitle>
          <CardDescription>Consumo mensual consultado desde la base de datos</CardDescription>
        </CardHeader>
        <CardContent>
          {monthly.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {monthly.map((item) => (
                <div key={item.month} className="rounded-lg border p-3 text-center">
                  <div className="text-sm text-gray-600">{item.month}</div>
                  <div className="mt-1 text-xl">{(item.liters / 1000).toFixed(2)} m³</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No hay lecturas mensuales para mostrar.</p>
          )}
        </CardContent>
      </Card>
      <Button
        variant="outline"
        className="w-full justify-start"
        onClick={() => toast.info('Las tarifas se administran en el backend.')}
      >
        <Settings className="size-4 mr-2" /> {t('reports.configureRates')}
      </Button>
    </div>
  );
}

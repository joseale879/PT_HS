import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  consumptionApi,
  homesApi,
  reportsApi,
  tariffApi,
  type GeneratedReport,
} from '@shared/http/httpClient';
import { Download } from 'lucide-react';

type Home = { id: string; name: string; tier?: number | null };
type ReportData = { totalM3?: number; totalCost?: number; readingCount?: number };
type ReportTariff = {
  m3Value?: number;
  fixedCharge?: number;
  year?: number;
  month?: number;
  source?: string;
};

export function ReportsAnalytics({ homeId }: { homeId?: string }) {
  const { t, i18n } = useTranslation();
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState(homeId || '');
  const [summary, setSummary] = useState<ReportData>({});
  const [tariff, setTariff] = useState<ReportTariff | null>(null);
  const [monthly, setMonthly] = useState<Array<{ month: string; liters: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  useEffect(() => {
    homesApi
      .list()
      .then(({ data }) => {
        const loaded = (data as Array<{ homeId: string; name: string; tier?: number }>).map(
          (home) => ({
            id: String(home.homeId),
            name: String(home.name),
            tier: home.tier,
          })
        );
        setHomes(loaded);
        setSelectedHomeId((current) => current || loaded[0]?.id || '');
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : t('reports.homesLoadError'))
      );
  }, [t]);

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
      consumptionApi
        .summary(new URLSearchParams({ homeId: selectedHomeId, from, to }).toString())
        .catch(() => ({ data: null })),
      tariffApi.currentByHome(selectedHomeId).catch(() => ({ data: null })),
      Promise.all(
        Array.from({ length: 6 }, (_, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          return consumptionApi
            .monthly(
              new URLSearchParams({
                homeId: selectedHomeId,
                year: String(date.getFullYear()),
                month: String(date.getMonth() + 1),
              }).toString()
            )
            .catch(() => ({ data: null }));
        })
      ),
    ])
      .then(([summaryResponse, tariffResponse, monthlyResponses]) => {
        const apiSummary = summaryResponse.data as ReportData | null;
        const apiTariff = tariffResponse.data as ReportTariff | null;
        const realMonthly = monthlyResponses.map((response, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
          return {
            month: date.toLocaleDateString(i18n.language, { month: 'short' }),
            liters: Number(
              (response.data as { consumptionLiters?: number } | null)?.consumptionLiters || 0
            ),
          };
        });
        setSummary(apiSummary || {});
        setTariff(apiTariff);
        setMonthly(realMonthly);
      })
      .catch((error) => {
        setSummary({});
        setTariff(null);
        setMonthly([]);
        toast.error(error instanceof Error ? error.message : t('reports.loadError'));
      })
      .finally(() => setLoading(false));
  }, [i18n.language, selectedHomeId, t]);

  useEffect(() => {
    if (!selectedHomeId) {
      setHistory([]);
      return;
    }
    setHistoryLoading(true);
    reportsApi
      .history(selectedHomeId, { pageSize: 10 })
      .then(({ data }) => setHistory(data))
      .catch((error) => {
        setHistory([]);
        toast.error(error instanceof Error ? error.message : t('reports.historyLoadError'));
      })
      .finally(() => setHistoryLoading(false));
  }, [historyRefresh, selectedHomeId, t]);

  const currentM3 = Number(summary.totalM3 || 0);
  const currentCost = Number(summary.totalCost || 0);
  const rate = Number(tariff?.m3Value || 0);
  const selectedHome = useMemo(
    () => homes.find((home) => home.id === selectedHomeId),
    [homes, selectedHomeId]
  );

  const downloadReport = async (format: 'pdf' | 'excel') => {
    if (!selectedHomeId) return;
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    setDownloading(format);
    try {
      const query = new URLSearchParams({ homeId: selectedHomeId, from, to }).toString();
      const blob =
        format === 'pdf'
          ? await reportsApi.downloadConsumptionPdf(query)
          : await reportsApi.downloadConsumptionExcel(query);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hidro-smart-consumo-${from}-${to}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(t(format === 'pdf' ? 'reports.pdfDownloaded' : 'reports.excelDownloaded'));
      setHistoryRefresh((current) => current + 1);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t(format === 'pdf' ? 'reports.pdfDownloadError' : 'reports.excelDownloadError')
      );
    } finally {
      setDownloading(null);
    }
  };

  const downloadStoredReport = async (report: GeneratedReport) => {
    try {
      const blob = await reportsApi.downloadStored(report.reportId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hidro-smart-reporte-${report.reportId}.${report.type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('reports.historyDownloadError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl text-gray-900">{t('reports.title')}</h2>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
          <Button
            type="button"
            variant="outline"
            onClick={() => void downloadReport('pdf')}
            disabled={!selectedHomeId || downloading !== null}
          >
            <Download aria-hidden="true" />
            {downloading === 'pdf' ? t('reports.downloadingPdf') : t('reports.downloadPdf')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void downloadReport('excel')}
            disabled={!selectedHomeId || downloading !== null}
          >
            <Download aria-hidden="true" />
            {downloading === 'excel' ? t('reports.downloadingExcel') : t('reports.downloadExcel')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.title')}</CardTitle>
          <CardDescription>{selectedHome?.name || t('homes.home')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">{t('reports.dataSourceNotice')}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.currentConsumption')}</CardDescription>
            <CardTitle>{loading ? '—' : `${currentM3} m³`}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {summary.readingCount || 0} {t('reports.readings')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.monthProjection')}</CardDescription>
            <CardTitle>{currentCost ? `$${currentCost}` : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{t('reports.backendCalculated')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('reports.waterRate')}</CardDescription>
            <CardTitle>{rate ? `$${rate}` : '—'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {tariff?.fixedCharge
                ? `${t('reports.fixedCharge')}: $${tariff.fixedCharge}`
                : t('reports.noCurrentRate')}
            </p>
            {tariff?.year && tariff.month && (
              <p className="mt-1 text-xs text-gray-500">
                {tariff.year}-{String(tariff.month).padStart(2, '0')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.historicalComparison')}</CardTitle>
          <CardDescription>{t('reports.databaseMonthlyNotice')}</CardDescription>
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
            <p className="text-sm text-gray-500">{t('reports.noMonthlyReadings')}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('reports.historyTitle')}</CardTitle>
          <CardDescription>{t('reports.historyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <p className="text-sm text-gray-500">{t('reports.historyLoading')}</p>
          ) : history.length ? (
            <div className="space-y-2">
              {history.map((report) => (
                <div
                  key={report.reportId}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {report.type === 'pdf'
                        ? t('reports.reportTypePdf')
                        : t('reports.reportTypeExcel')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {report.periodStart || '—'} {report.periodEnd ? `→ ${report.periodEnd}` : ''}{' '}
                      · {new Date(report.createdAt).toLocaleString(i18n.language)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={report.status !== 'Ready'}
                    onClick={() => void downloadStoredReport(report)}
                  >
                    <Download aria-hidden="true" />
                    {report.status === 'Ready'
                      ? t('reports.downloadStored')
                      : t(`reports.status${report.status}`)}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t('reports.historyEmpty')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

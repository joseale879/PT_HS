import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Calendar } from '@shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Badge } from '@shared/ui/badge';
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Settings,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface Home {
  id: number;
  name: string;
}

interface HomeMember {
  id: number;
  homeId: number;
  userId: number;
  role: 'admin' | 'member';
}

export function ReportsAnalytics() {
  const { t } = useTranslation();

  // Usuario actual (simulando sesión)
  const CURRENT_USER_ID = 1;

  // Datos de hogares (simplificados)
  const [homes] = useState<Home[]>([
    { id: 1, name: 'Casa Principal' },
    { id: 2, name: 'Apartamento Centro' },
    { id: 3, name: 'Apartamento Arrendado Norte' }
  ]);

  // Membresías de hogares
  const [homeMembers] = useState<HomeMember[]>([
    { id: 1, homeId: 1, userId: 1, role: 'admin' },
    { id: 2, homeId: 2, userId: 1, role: 'admin' },
    { id: 3, homeId: 3, userId: 1, role: 'member' }
  ]);

  const [selectedHomeId, setSelectedHomeId] = useState(1);
  const [dateRange, setDateRange] = useState<Date | undefined>(new Date());
  const [isTariffDialogOpen, setIsTariffDialogOpen] = useState(false);
  const [tariffRate, setTariffRate] = useState(3450);

  // Obtener rol del usuario en el hogar seleccionado
  const getCurrentUserRole = (homeId: number): 'admin' | 'member' | null => {
    const membership = homeMembers.find(
      m => m.homeId === homeId && m.userId === CURRENT_USER_ID
    );
    return membership ? membership.role : null;
  };

  const currentHomeRole = getCurrentUserRole(selectedHomeId);
  const getHomeName = (name: string) => t(`devices.homeNames.${name}`, { defaultValue: name });
  const getSegmentName = (segment: string) => t(`reports.segments.${segment}`, { defaultValue: segment });

  // RF23 - Exportar a PDF
  const handleExportPDF = () => {
    toast.success(t('reports.generatingPdf'), {
      description: t('reports.downloadSoon')
    });
  };

  // RF23.2 - Exportar a Excel
  const handleExportExcel = () => {
    toast.success(t('reports.generatingExcel'), {
      description: t('reports.excelDownloadSoon')
    });
  };

  // RF17.3 - Guardar configuración de tarifas
  const handleSaveTariff = () => {
    toast.success(t('reports.tariffUpdated'), {
      description: t('reports.newTariff', { tariff: tariffRate })
    });
    setIsTariffDialogOpen(false);
  };

  // RF15 - Datos para comparativas históricas
  const monthlyComparison = [
    { month: t('reports.months.jan'), current: 48.5, previous: 55.2 },
    { month: t('reports.months.feb'), current: 52.3, previous: 58.1 },
    { month: t('reports.months.mar'), current: 45.8, previous: 52.3 },
    { month: t('reports.months.apr'), current: 51.2, previous: 54.8 },
    { month: t('reports.months.may'), current: 49.5, previous: 56.5 },
    { month: t('reports.months.jun'), current: 47.3, previous: 53.2 },
  ];

  // RF13 - Análisis de tendencias
  const weeklyTrends = [
    { week: t('reports.weekNumber', { number: 1 }), consumption: 12.5, avg: 13.2 },
    { week: t('reports.weekNumber', { number: 2 }), consumption: 13.8, avg: 13.2 },
    { week: t('reports.weekNumber', { number: 3 }), consumption: 11.2, avg: 13.2 },
    { week: t('reports.weekNumber', { number: 4 }), consumption: 14.8, avg: 13.2 },
  ];

  // RF14 - Datos de reporte detallado
  const consumptionSegments = [
    { segment: 'Baño', consumption: 28.5, percentage: 54 },
    { segment: 'Cocina', consumption: 15.2, percentage: 29 },
    { segment: 'Jardín', consumption: 8.6, percentage: 17 },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de hogar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl text-gray-900">{t('reports.title')}</h2>
          <p className="text-gray-600">{t('reports.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-1 sm:w-auto">
          <Label className="text-xs text-gray-600">{t('homes.home')}</Label>
          <Select value={selectedHomeId.toString()} onValueChange={(value) => setSelectedHomeId(Number(value))}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {homes.map((home) => {
                const role = getCurrentUserRole(home.id);
                return (
                  <SelectItem key={home.id} value={home.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4" />
                      {getHomeName(home.name)} {role === 'admin' ? `(${t('homes.adminShort')})` : role === 'member' ? `(${t('homes.member')})` : ''}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* RF14 - Generación de reportes */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.generateReport')}</CardTitle>
          <CardDescription>
            {t('reports.generateReportDesc')} - {getHomeName(homes.find(h => h.id === selectedHomeId)?.name || '')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm">{t('reports.customReport')}</label>
              <Select defaultValue="detailed">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">{t('reports.dailyReport')}</SelectItem>
                  <SelectItem value="summary">{t('reports.summaryReport')}</SelectItem>
                  <SelectItem value="comparative">{t('reports.comparativeReport')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">{t('reports.period')}</label>
              <Select defaultValue="monthly">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">{t('reports.daily')}</SelectItem>
                  <SelectItem value="weekly">{t('reports.weekly')}</SelectItem>
                  <SelectItem value="monthly">{t('reports.monthly')}</SelectItem>
                  <SelectItem value="annual">{t('reports.annual')}</SelectItem>
                  <SelectItem value="custom">{t('reports.customPeriod')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm">{t('reports.date')}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="size-4" />
                    {dateRange ? dateRange.toLocaleDateString() : t('common.select')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange}
                    onSelect={setDateRange}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm">{t('reports.actions')}</label>
              <Button className="w-full" onClick={handleExportPDF}>
                <Download className="size-4" />
                {t('reports.exportAsPDF')}
              </Button>
              <Button className="w-full" onClick={handleExportExcel}>
                <FileSpreadsheet className="size-4" />
                {t('reports.exportAsExcel')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RF15 - Comparativas históricas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.historicalComparison')}</CardTitle>
          <CardDescription>{t('reports.historicalComparisonDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly">
            <TabsList className="!grid !w-full grid-cols-3 mobile-equal-tabs [--mobile-tabs:3] sm:!grid sm:!w-full">
              <TabsTrigger value="monthly" className="whitespace-nowrap px-3 text-xs sm:text-sm">{t('reports.monthly')}</TabsTrigger>
              <TabsTrigger value="weekly" className="whitespace-nowrap px-3 text-xs sm:text-sm">{t('reports.weekly')}</TabsTrigger>
              <TabsTrigger value="yearly" className="whitespace-nowrap px-3 text-xs sm:text-sm">{t('reports.annual')}</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('reports.thisMonth')}</div>
                    <div className="text-2xl mt-1">52.3 m³</div>
                    <div className="flex items-center gap-1 text-green-600 text-sm mt-1">
                      <TrendingDown className="size-4" />
                      <span>{t('reports.vsPreviousMonth', { percent: '-11%' })}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('reports.previousMonth')}</div>
                    <div className="text-2xl mt-1">58.1 m³</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{t('reports.sixMonthAverage')}</div>
                    <div className="text-2xl mt-1">54.7 m³</div>
                  </div>
                </div>

                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#3b82f6" name={t('reports.currentYear')} />
                      <Bar dataKey="previous" fill="#94a3b8" name={t('reports.previousYear')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="weekly">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#3b82f6" name={t('reports.consumption')} />
                    <Line type="monotone" dataKey="avg" stroke="#94a3b8" strokeDasharray="5 5" name={t('reports.average')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="yearly">
              <div className="text-center py-8 text-gray-600">
                {t('reports.yearlyComparisonUnavailable')}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* RF14.2 - Consumo segmentado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.consumptionBySegment')}</CardTitle>
            <CardDescription>{t('reports.monthlyConsumptionDistribution')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consumptionSegments.map((segment) => (
                <div key={segment.segment} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{getSegmentName(segment.segment)}</span>
                    <span className="flex items-center gap-2">
                      <span>{segment.consumption} m³</span>
                      <Badge variant="outline">{segment.percentage}%</Badge>
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${segment.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RF13 - Análisis de tendencias */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.trendAnalysis')}</CardTitle>
            <CardDescription>{t('reports.consumptionInsights')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingDown className="size-5 text-green-600 mt-0.5" />
                <div>
                  <div className="text-sm">{t('reports.positiveTrend')}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('reports.positiveTrendDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="text-sm">{t('reports.higherConsumptionDetected')}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('reports.higherConsumptionDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="text-sm">{t('reports.peakHours')}</div>
                  <p className="text-xs text-gray-600 mt-1">
                    {t('reports.peakHoursDesc')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RF21 - Proyección de tarifas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.costProjection')}</CardTitle>
          <CardDescription>{t('reports.costProjectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600">{t('reports.currentConsumption')}</div>
              <div className="text-2xl mt-1">52.3 m³</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('reports.waterRate')}</div>
              <div className="text-2xl mt-1">$3,450</div>
              <div className="text-xs text-gray-600">{t('reports.perCubicMeter')}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('reports.monthProjection')}</div>
              <div className="text-2xl mt-1">$270,855</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('reports.estimatedSavings')}</div>
              <div className="text-2xl mt-1 text-green-600">$33,450</div>
              <div className="text-xs text-gray-600">{t('reports.vsPreviousMonthShort')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RF17.3 - Configuración de tarifas */}
      <Dialog open={isTariffDialogOpen} onOpenChange={setIsTariffDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            <Settings className="size-4 mr-2" />
            {t('reports.configureRates')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reports.configureRates')}</DialogTitle>
            <DialogDescription>{t('reports.configureRatesDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="tariffRate">{t('reports.waterRateCop')}</Label>
            <Input
              id="tariffRate"
              type="number"
              value={tariffRate}
              onChange={(e) => setTariffRate(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveTariff}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Switch } from '@shared/ui/switch';
import { Label } from '@shared/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Droplets,
  TrendingUp,
  Battery,
  Settings
} from 'lucide-react';

export function NotificationsPanel() {
  const { t } = useTranslation();
  // RF8.4 - Historial de notificaciones
  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: t('notifications.items.leakTitle'),
      message: t('notifications.items.leakMessage'),
      time: t('notifications.times.twoHours'),
      read: false,
      icon: AlertTriangle,
      color: 'orange'
    },
    {
      id: 2,
      type: 'warning',
      title: t('notifications.items.lowBatteryTitle'),
      message: t('notifications.items.lowBatteryMessage'),
      time: t('notifications.times.fiveHours'),
      read: false,
      icon: Battery,
      color: 'yellow'
    },
    {
      id: 3,
      type: 'info',
      title: t('notifications.items.weeklyReportTitle'),
      message: t('notifications.items.weeklyReportMessage'),
      time: t('notifications.times.oneDay'),
      read: true,
      icon: Droplets,
      color: 'blue'
    },
    {
      id: 4,
      type: 'success',
      title: t('notifications.items.goalReachedTitle'),
      message: t('notifications.items.goalReachedMessage'),
      time: t('notifications.times.twoDays'),
      read: true,
      icon: CheckCircle2,
      color: 'green'
    },
    {
      id: 5,
      type: 'info',
      title: t('notifications.items.highConsumptionTitle'),
      message: t('notifications.items.highConsumptionMessage'),
      time: t('notifications.times.threeDays'),
      read: true,
      icon: TrendingUp,
      color: 'blue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* RF8.3 - Configuración de notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications.settings')}</CardTitle>
          <CardDescription>{t('notifications.settingsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* RF8.1 - Notificaciones de consumo */}
            <div>
              <h3 className="text-sm mb-4">{t('notifications.consumptionNotifications')}</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.dailyConsumptionReport')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.dailyConsumptionReportDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.weeklyReport')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.weeklyReportDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.monthlyReport')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.monthlyReportDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            {/* RF8.2 - Alertas de fugas y consumo anormal */}
            <div className="pt-6 border-t">
              <h3 className="text-sm mb-4">{t('notifications.criticalAlerts')}</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.leakDetection')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.leakDetectionDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.abnormalConsumption')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.abnormalConsumptionDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.flowThresholdExceeded')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.flowThresholdExceededDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-sm mb-4">{t('notifications.deviceStatus')}</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.deviceDisconnected')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.deviceDisconnectedDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.lowBattery')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.lowBatteryDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <h3 className="text-sm mb-4">{t('notifications.notificationChannels')}</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <Label>{t('notifications.email')}</Label>
                    <p className="text-xs text-gray-600">{t('notifications.emailDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* RF8.4 - Historial de notificaciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>{t('notifications.history')}</CardTitle>
              <CardDescription>{t('notifications.historyDesc')}</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              {t('notifications.markAllAsRead')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs [--mobile-tabs:2] sm:!grid sm:!w-full sm:grid-cols-4">
              <TabsTrigger value="all" className="px-3 text-xs sm:text-sm">
                {t('notifications.all', { count: notifications.length })}
              </TabsTrigger>
              <TabsTrigger value="unread" className="px-3 text-xs sm:text-sm">
                {t('notifications.unread', { count: notifications.filter(n => !n.read).length })}
              </TabsTrigger>
              <TabsTrigger value="alerts" className="px-3 text-xs sm:text-sm">{t('notifications.alerts')}</TabsTrigger>
              <TabsTrigger value="info" className="px-3 text-xs sm:text-sm">{t('notifications.updates')}</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 mt-4">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      notification.color === 'orange' ? 'bg-orange-100' :
                      notification.color === 'yellow' ? 'bg-yellow-100' :
                      notification.color === 'blue' ? 'bg-blue-100' :
                      notification.color === 'green' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`size-5 ${
                        notification.color === 'orange' ? 'text-orange-600' :
                        notification.color === 'yellow' ? 'text-yellow-600' :
                        notification.color === 'blue' ? 'text-blue-600' :
                        notification.color === 'green' ? 'text-green-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm">{notification.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <Badge variant="default" className="bg-blue-600">{t('notifications.new')}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{t('dashboard.ago')} {notification.time}</p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="unread" className="space-y-3 mt-4">
              {notifications.filter(n => !n.read).map((notification) => {
                const Icon = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-blue-50 border-blue-200"
                  >
                    <div className={`p-2 rounded-lg ${
                      notification.color === 'orange' ? 'bg-orange-100' :
                      notification.color === 'yellow' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <Icon className={`size-5 ${
                        notification.color === 'orange' ? 'text-orange-600' :
                        notification.color === 'yellow' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm">{notification.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">{t('dashboard.ago')} {notification.time}</p>
                    </div>
                  </div>
                );
              })}
            </TabsContent>

            <TabsContent value="alerts" className="text-center py-8 text-gray-600">
              {t('notifications.filteringCriticalAlerts')}
            </TabsContent>

            <TabsContent value="info" className="text-center py-8 text-gray-600">
              {t('notifications.filteringInfoNotifications')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

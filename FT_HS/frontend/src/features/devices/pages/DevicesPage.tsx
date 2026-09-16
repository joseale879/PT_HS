import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Badge } from '@shared/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog';
import {
  Activity,
  Bluetooth,
  Copy,
  Droplets,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  actuatorsApi,
  devicesApi,
  type ActuatorCommandValue,
  type ActuatorState,
  type CollectionPagination,
  type DeviceTelemetry,
  type DeviceListOptions,
} from '@shared/http/httpClient';
import { toast } from 'sonner';
import { can } from '@shared/config/authorization';
import {
  connectBleProvisioning,
  isBleProvisioningSupported,
  type BleProvisioningConnection,
  type BleProvisioningStatus,
} from '@shared/iot/bleProvisioning';

type Device = {
  deviceId: string;
  code: string;
  name: string;
  type?: string;
  location?: string | null;
  hardwareId?: string | null;
  status: string;
  connectivityStatus?: string;
  alertThreshold?: number | null;
  lastConnectionAt?: string | null;
  lastIp?: string | null;
  wifiSsid?: string | null;
  wifiRssiDbm?: number | null;
  homeId: string;
  latestTelemetry?: DeviceTelemetry | null;
  provisioningStatus?: string | null;
  provisioningError?: string | null;
  provisioningUpdatedAt?: string | null;
  provisionedAt?: string | null;
};
type Home = { homeId: string; name: string; homeRole?: 'Owner' | 'Member' | 'Guest' };

const BLE_BACKEND_STATUS: Record<string, string> = {
  wifi_connected: 'WIFI_CONNECTED',
  provisioning_complete: 'COMPLETE',
  wifi_failed: 'FAILED',
  mqtt_unreachable: 'FAILED',
};

function nextActuatorCommand(state: ActuatorState): ActuatorCommandValue {
  if (state.actuator === 'VALVE') return state.status === 'OPEN' ? 'CLOSED' : 'OPEN';
  return state.status === 'ON' ? 'OFF' : 'ON';
}

const DEFAULT_PAGINATION: CollectionPagination = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};

export function DeviceManagement({
  permissions,
  homeId,
  homes,
  onHomeChange,
}: {
  permissions: string[];
  homeId: string;
  homes: Home[];
  onHomeChange: (homeId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const [devices, setDevices] = useState<Device[]>([]);
  const [pagination, setPagination] = useState<CollectionPagination>(DEFAULT_PAGINATION);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<DeviceListOptions['sort']>('name');
  const [order, setOrder] = useState<DeviceListOptions['order']>('asc');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [threshold, setThreshold] = useState('');
  const [historyDevice, setHistoryDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceTelemetry[]>([]);
  const [historyPagination, setHistoryPagination] =
    useState<CollectionPagination>(DEFAULT_PAGINATION);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actuatorStates, setActuatorStates] = useState<ActuatorState[]>([]);
  const [commandingActuator, setCommandingActuator] = useState<string | null>(null);
  const [provisioningDevice, setProvisioningDevice] = useState<Device | null>(null);
  const [provisioningHardwareId, setProvisioningHardwareId] = useState('');
  const [provisioningStatus, setProvisioningStatus] = useState('PENDING');
  const [provisioningError, setProvisioningError] = useState('');
  const [provisioningSaving, setProvisioningSaving] = useState(false);
  const [bleConnection, setBleConnection] = useState<BleProvisioningConnection | null>(null);
  const [bleDeviceName, setBleDeviceName] = useState('');
  const [bleState, setBleState] = useState('');
  const [bleConnecting, setBleConnecting] = useState(false);
  const [bleWriting, setBleWriting] = useState(false);
  const [hardwareClaiming, setHardwareClaiming] = useState(false);
  const [bleSsid, setBleSsid] = useState('');
  const [blePassword, setBlePassword] = useState('');
  const [bleMqttHost, setBleMqttHost] = useState('');
  const [bleMqttPort, setBleMqttPort] = useState('1883');
  const [bleIp, setBleIp] = useState('');
  const [bleRssi, setBleRssi] = useState<number | null>(null);
  const selectedHome = homes.find((home) => home.homeId === homeId);
  const isHomeOwner = selectedHome?.homeRole === 'Owner';
  const canManageAssignedDevice =
    ['Owner', 'Member'].includes(selectedHome?.homeRole || '') &&
    can(permissions, 'devices.manage');
  const canRegisterDevice = isHomeOwner && can(permissions, 'devices.manage');
  const canUnlinkDevice = isHomeOwner && can(permissions, 'devices.manage');
  const canManageActuators =
    ['Owner', 'Member'].includes(selectedHome?.homeRole || '') &&
    can(permissions, 'actuators.manage');

  const loadDevices = async (id = homeId, requestedPage = page) => {
    if (!id) {
      setLoading(false);
      setDevices([]);
      setPagination(DEFAULT_PAGINATION);
      setLoadError(null);
      return;
    }

    setLoading(true);
    setLoadError(null);
    try {
      const [response, actuatorResponse] = await Promise.all([
        devicesApi.list(id, {
          page: requestedPage,
          pageSize: DEFAULT_PAGINATION.pageSize,
          sort,
          order,
        }),
        actuatorsApi.states(id).catch(() => ({ data: [] as ActuatorState[] })),
      ]);
      const nextPagination = response.pagination || DEFAULT_PAGINATION;
      const listedDevices = (response.data as Omit<Device, 'homeId'>[]).map((device) => ({
        ...device,
        homeId: id,
      }));
      const devicesWithTelemetry = await Promise.all(
        listedDevices.map(async (device) => {
          try {
            const telemetry = await devicesApi.latestTelemetry(device.deviceId);
            return { ...device, latestTelemetry: telemetry.data };
          } catch {
            return { ...device, latestTelemetry: null };
          }
        })
      );
      setDevices(devicesWithTelemetry);
      setActuatorStates(actuatorResponse.data);
      setPagination(nextPagination);
      if (nextPagination.totalPages > 0 && requestedPage > nextPagination.totalPages) {
        setPage(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('devices.loadError');
      setLoadError(message);
      setDevices([]);
      setActuatorStates([]);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (deviceId: string, requestedPage = historyPage) => {
    setHistoryLoading(true);
    try {
      const response = await devicesApi.telemetry(deviceId, {
        page: requestedPage,
        pageSize: 8,
        sort: 'measuredAt',
        order: 'desc',
      });
      setHistory(response.data);
      setHistoryPagination(response.pagination || DEFAULT_PAGINATION);
      setHistoryPage(requestedPage);
    } catch (error) {
      setHistory([]);
      toast.error(error instanceof Error ? error.message : t('devices.historyError'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistory = (device: Device) => {
    setHistoryDevice(device);
    setHistoryPage(1);
    void loadHistory(device.deviceId, 1);
  };

  useEffect(() => {
    setPage(1);
  }, [homeId]);

  useEffect(() => {
    void loadDevices(homeId, page);
  }, [homeId, page, sort, order]);

  const register = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await devicesApi.register({
        homeId,
        name: String(form.get('name') || '').trim(),
        type: String(form.get('type') || '').trim(),
        alertThreshold: Number(form.get('threshold')) || null,
      });
      toast.success(t('devices.deviceLinked'));
      handleRegistrationOpenChange(false);
      event.currentTarget.reset();
      setPage(1);
      await loadDevices(homeId, 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.registerError'));
    }
  };

  const linkExisting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await devicesApi.link({
        homeId,
        code: String(form.get('code') || '').trim(),
      });
      toast.success(t('devices.deviceLinked'));
      setLinkOpen(false);
      event.currentTarget.reset();
      setPage(1);
      await loadDevices(homeId, 1);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.registerError'));
    }
  };

  const openProvisioning = (device: Device) => {
    setProvisioningDevice(device);
    setEditName(device.name);
    setEditLocation(device.location || '');
    setThreshold(String(device.alertThreshold ?? ''));
    setProvisioningHardwareId(device.hardwareId || '');
    setProvisioningStatus(device.provisioningStatus || 'PENDING');
    setProvisioningError(device.provisioningError || '');
    setBleDeviceName('');
    setBleState('');
    setBleSsid('');
    setBlePassword('');
    setBleMqttHost('');
    setBleMqttPort('1883');
    setBleIp('');
    setBleRssi(null);
  };

  const closeProvisioning = () => {
    bleConnection?.disconnect();
    setBleConnection(null);
    setProvisioningDevice(null);
    setBlePassword('');
    setBleIp('');
    setBleRssi(null);
  };

  const claimHardware = async () => {
    if (!provisioningDevice || !provisioningHardwareId.trim()) return;
    setHardwareClaiming(true);
    try {
      const response = await devicesApi.claimHardware(
        provisioningDevice.deviceId,
        provisioningHardwareId.trim()
      );
      const updated = response.data as Partial<Device>;
      setDevices((current) =>
        current.map((device) =>
          device.deviceId === provisioningDevice.deviceId ? { ...device, ...updated } : device
        )
      );
      setProvisioningDevice((current) => (current ? { ...current, ...updated } : current));
      setProvisioningStatus(String(updated.provisioningStatus || 'BLE_READY'));
      setProvisioningError('');
      toast.success(t('devices.hardwareClaimed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.hardwareClaimError'));
    } finally {
      setHardwareClaiming(false);
    }
  };

  const applyBleStatus = async (status: BleProvisioningStatus) => {
    const reportedState = String(status.state || '')
      .trim()
      .toLowerCase();
    const state =
      reportedState === 'ready' && status.wifiConnected
        ? status.mqttConnected
          ? 'mqtt_connected'
          : 'wifi_connected'
        : reportedState;
    setBleState(state || 'ready');
    if (status.hardwareId) setProvisioningHardwareId(status.hardwareId);
    if (status.ssid) setBleSsid(status.ssid);
    if (status.ip) setBleIp(status.ip);
    if (typeof status.rssi === 'number') setBleRssi(status.rssi);
    if (status.mqttConnected) setProvisioningError('');

    const nextStatus = state ? BLE_BACKEND_STATUS[state] : 'BLE_READY';
    if (state === 'mqtt_unreachable') {
      setProvisioningError(t('devices.bleMqttUnreachable'));
    } else if (state === 'wifi_failed') {
      setProvisioningError(t('devices.bleWifiFailed'));
    }
    if (!nextStatus || !provisioningDevice) return;
    if (status.hardwareId && status.hardwareId !== provisioningDevice.hardwareId) {
      return;
    }

    try {
      const response = await devicesApi.updateProvisioning(provisioningDevice.deviceId, {
        hardwareId: status.hardwareId || provisioningHardwareId.trim() || null,
        provisioningStatus: nextStatus,
        provisioningError:
          state === 'mqtt_unreachable'
            ? t('devices.bleMqttUnreachable')
            : state === 'wifi_failed'
              ? t('devices.bleWifiFailed')
              : null,
      });
      const updated = response.data as Partial<Device>;
      setDevices((current) =>
        current.map((device) =>
          device.deviceId === provisioningDevice.deviceId ? { ...device, ...updated } : device
        )
      );
      setProvisioningDevice((current) => (current ? { ...current, ...updated } : current));
      setProvisioningStatus(nextStatus);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.provisioningUpdateError'));
    }
  };

  const connectBle = async () => {
    if (!isBleProvisioningSupported()) {
      toast.error(t('devices.bleUnsupported'));
      return;
    }
    setBleConnecting(true);
    try {
      const connection = await connectBleProvisioning((status) => {
        void applyBleStatus(status);
      });
      setBleConnection(connection);
      setBleDeviceName(connection.deviceName);
      if (connection.initialStatus) await applyBleStatus(connection.initialStatus);
      toast.success(t('devices.bleConnected'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.bleConnectionError'));
    } finally {
      setBleConnecting(false);
    }
  };

  const sendBleConfiguration = async () => {
    if (!bleConnection) return;
    if (
      !provisioningDevice?.hardwareId ||
      provisioningDevice.hardwareId !== provisioningHardwareId.trim()
    ) {
      toast.error(t('devices.claimHardwareFirst'));
      return;
    }
    const port = Number(bleMqttPort);
    if (
      !bleSsid.trim() ||
      !bleMqttHost.trim() ||
      !Number.isInteger(port) ||
      port < 1 ||
      port > 65535
    ) {
      toast.error(t('devices.bleInvalidConfiguration'));
      return;
    }

    setBleWriting(true);
    try {
      await bleConnection.write({
        ssid: bleSsid.trim(),
        password: blePassword,
        mqttHost: bleMqttHost.trim(),
        mqttPort: port,
        deviceCode: provisioningDevice.code,
      });
      setBleState('wifi_connecting');
      toast.success(t('devices.bleConfigurationSent'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.bleWriteError'));
    } finally {
      setBleWriting(false);
    }
  };

  const handleRegistrationOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!provisioningDevice) return;
    setProvisioningSaving(true);
    try {
      const deviceResponse = await devicesApi.update(provisioningDevice.deviceId, {
        name: editName.trim(),
        location: editLocation.trim() || null,
        alertThreshold: threshold.trim() ? Number(threshold) : null,
      });
      const provisioningResponse = await devicesApi.updateProvisioning(
        provisioningDevice.deviceId,
        {
          hardwareId: provisioningDevice.hardwareId || null,
          provisioningStatus,
          provisioningError: provisioningError.trim() || null,
        }
      );
      const updated = {
        ...(deviceResponse.data as Partial<Device>),
        ...(provisioningResponse.data as Partial<Device>),
      };
      setDevices((current) =>
        current.map((device) =>
          device.deviceId === provisioningDevice.deviceId ? { ...device, ...updated } : device
        )
      );
      setProvisioningDevice((current) => (current ? { ...current, ...updated } : current));
      toast.success(t('devices.deviceSettingsSaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.deviceSettingsError'));
    } finally {
      setProvisioningSaving(false);
    }
  };

  const unlink = async (device: Device) => {
    try {
      await devicesApi.unlink(device.deviceId, homeId);
      await loadDevices(homeId, page);
      toast.success(t('devices.deviceUnlinked'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.unlinkError'));
    }
  };

  const sendActuatorCommand = async (device: Device, state: ActuatorState) => {
    const command = nextActuatorCommand(state);
    const commandKey = `${device.deviceId}:${state.actuator}`;
    setCommandingActuator(commandKey);
    try {
      await actuatorsApi.sendCommand(device.deviceId, state.actuator, command);
      toast.success(t('devices.actuatorCommandSent'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('devices.actuatorCommandError'));
    } finally {
      setCommandingActuator(null);
    }
  };

  const online = devices.filter((device) => device.connectivityStatus === 'ONLINE').length;
  const currentPage = pagination.page || page;
  const totalPages = pagination.totalPages || 0;
  const isFirstPage = currentPage <= 1;
  const isLastPage = totalPages === 0 || currentPage >= totalPages;
  const dateLocale = i18n.language || 'es-CO';
  const currentConnectivity = String(provisioningDevice?.connectivityStatus || '').toUpperCase();
  const isWifiConfigured = Boolean(
    provisioningDevice &&
      currentConnectivity !== 'OFFLINE' &&
      (currentConnectivity === 'ONLINE' ||
        ['WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE'].includes(
          String(provisioningDevice.provisioningStatus || '').toUpperCase()
        ) ||
        ['wifi_connected', 'mqtt_connected', 'provisioning_complete', 'mqtt_unreachable'].includes(
          bleState
        ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl">{t('devices.title')}</h2>
          <p className="text-gray-600">{t('devices.subtitle')}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <select
            className="h-11 w-full rounded-md border px-3 sm:w-auto"
            value={homeId}
            onChange={(event) => onHomeChange(event.target.value)}
            aria-label={t('devices.selectHome')}
          >
            <option value="">{t('common.select')}</option>
            {homes.map((home) => (
              <option key={home.homeId} value={home.homeId}>
                {home.name}
              </option>
            ))}
          </select>
          {!isHomeOwner && homeId && (
            <p className="w-full text-xs text-amber-700 sm:max-w-xs sm:self-center">
              {selectedHome?.homeRole === 'Member'
                ? t('devices.memberAccessDesc')
                : t('devices.adminMustRegisterDevices')}
            </p>
          )}
          <select
            className="h-11 w-full rounded-md border px-3 sm:w-auto"
            value={`${sort}:${order}`}
            onChange={(event) => {
              const [nextSort, nextOrder] = event.target.value.split(':') as [
                DeviceListOptions['sort'],
                DeviceListOptions['order'],
              ];
              setSort(nextSort);
              setOrder(nextOrder);
              setPage(1);
            }}
            aria-label={t('devices.sortBy')}
          >
            <option value="name:asc">{t('devices.sortNameAsc')}</option>
            <option value="name:desc">{t('devices.sortNameDesc')}</option>
            <option value="status:asc">{t('devices.sortStatusAsc')}</option>
            <option value="createdAt:desc">{t('devices.sortNewest')}</option>
          </select>
          {canRegisterDevice && (
            <>
              <Dialog open={open} onOpenChange={handleRegistrationOpenChange}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" disabled={!homeId || loading}>
                    <Plus className="mr-2 size-4" />
                    {t('devices.registerNewDevice')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={register}>
                    <DialogHeader>
                      <DialogTitle>{t('devices.registerNewDevice')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-gray-600">
                        {t('devices.registrationIdentityHelp')}
                      </p>
                      <Input name="name" placeholder={t('devices.deviceName')} required />
                      <Input name="type" placeholder={t('devices.type')} required />
                      <Input
                        name="threshold"
                        type="number"
                        min="0.01"
                        placeholder={t('devices.alertThreshold')}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('common.save')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    disabled={!homeId || loading}
                  >
                    {t('devices.linkDevice')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={linkExisting}>
                    <DialogHeader>
                      <DialogTitle>{t('devices.linkDevice')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-gray-600">{t('devices.linkNewSensor')}</p>
                      <Input name="code" placeholder={t('devices.deviceId')} required />
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('devices.linkDevice')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>{t('devices.total')}</CardDescription>
            <CardTitle>{pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('devices.online')}</CardDescription>
            <CardTitle className="text-green-600">{online}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('devices.offline')}</CardDescription>
            <CardTitle className="text-red-600">{Math.max(devices.length - online, 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border bg-white text-sm text-gray-600">
          <Loader2 className="mr-2 size-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : loadError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <Button variant="outline" onClick={() => void loadDevices(homeId, page)}>
            <RefreshCw className="mr-2 size-4" />
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {devices.length ? (
              devices.map((device) => {
                const connectivity = String(device.connectivityStatus || 'UNKNOWN').toUpperCase();
                const isOnline = connectivity === 'ONLINE';
                const isOffline = connectivity === 'OFFLINE';
                const deviceActuators = actuatorStates.filter(
                  (state) => state.deviceId === device.deviceId
                );
                return (
                  <Card key={device.deviceId}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Droplets className="size-6 text-blue-600" />
                        <Badge
                          variant={isOnline ? 'default' : isOffline ? 'destructive' : 'outline'}
                        >
                          {isOnline ? (
                            <Wifi className="mr-1 size-3" />
                          ) : (
                            <WifiOff className="mr-1 size-3" />
                          )}
                          {t(`devices.connectivity.${connectivity.toLowerCase()}`)}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{device.name}</CardTitle>
                      <CardDescription>
                        {device.code} · {device.type || '—'}
                      </CardDescription>
                      <p className="text-xs text-gray-500">
                        {t('devices.location')}: {device.location || '—'}
                      </p>
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-xs">
                        <span className="min-w-0 truncate text-blue-950">
                          {t('devices.hardwareId')}: {device.hardwareId || '—'}
                        </span>
                        <Badge
                          variant={device.provisioningStatus === 'COMPLETE' ? 'default' : 'outline'}
                        >
                          {t(
                            `devices.provisioningStates.${String(device.provisioningStatus || 'PENDING').toLowerCase()}`
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">
                        {t('devices.alertThreshold')}: {device.alertThreshold ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('devices.lastConnection')}:{' '}
                        {device.lastConnectionAt
                          ? new Date(device.lastConnectionAt).toLocaleString(dateLocale)
                          : '—'}
                      </p>
                      {device.latestTelemetry ? (
                        <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                          <div>
                            <span className="block text-xs text-gray-500">
                              {t('devices.currentFlow')}
                            </span>
                            <strong className="flex items-center gap-1">
                              <Activity className="size-3 text-blue-600" />
                              {device.latestTelemetry.flowRateLpm?.toFixed(2) ?? '—'} L/min
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">
                              {t('devices.totalVolume')}
                            </span>
                            <strong>
                              {device.latestTelemetry.totalLiters?.toFixed(2) ?? '—'} L
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">
                              {t('devices.lastReading')}
                            </span>
                            <strong>
                              {new Date(device.latestTelemetry.measuredAt).toLocaleString(
                                dateLocale
                              )}
                            </strong>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">
                              {t('devices.pulses')}
                            </span>
                            <strong>{device.latestTelemetry.pulses ?? '—'}</strong>
                          </div>
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed p-3 text-xs text-gray-500">
                          {t('devices.noTelemetryYet')}
                        </p>
                      )}
                      {deviceActuators.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-blue-950">
                              {t('devices.actuators')}
                            </p>
                            <span className="text-xs text-blue-700">
                              {t('devices.realtimeState')}
                            </span>
                          </div>
                          {deviceActuators.map((state) => {
                            const commandKey = `${device.deviceId}:${state.actuator}`;
                            const command = nextActuatorCommand(state);
                            return (
                              <div
                                key={commandKey}
                                className="flex flex-wrap items-center justify-between gap-2"
                              >
                                <span className="text-sm text-slate-700">
                                  {state.actuator === 'VALVE'
                                    ? t('devices.valve')
                                    : t('devices.pump')}{' '}
                                  <strong>{state.status}</strong>
                                </span>
                                {canManageActuators && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={commandingActuator === commandKey}
                                    onClick={() => void sendActuatorCommand(device, state)}
                                  >
                                    {commandingActuator === commandKey
                                      ? t('common.loading')
                                      : t('devices.sendActuatorCommand', { command })}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {canManageAssignedDevice && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProvisioning(device)}
                            >
                              {t('devices.configure')}
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => openHistory(device)}>
                          <History className="mr-2 size-4" />
                          {t('devices.viewHistory')}
                        </Button>
                        {canUnlinkDevice && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void unlink(device)}
                            aria-label={t('devices.unlinkDevice')}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-gray-600">{t('devices.noDevicesRegistered')}</p>
                {homeId && (
                  <p className="mt-2 text-sm text-gray-500">
                    {canRegisterDevice
                      ? t('devices.registerFirstSensor')
                      : t('devices.adminMustRegisterDevices')}
                  </p>
                )}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <span className="text-sm text-gray-600">
                {t('devices.pageOf', { page: currentPage, totalPages })}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isFirstPage}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  variant="outline"
                  disabled={isLastPage}
                  onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                >
                  {t('common.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {provisioningDevice && (
        <Dialog open onOpenChange={closeProvisioning}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <form onSubmit={saveSettings}>
              <DialogHeader>
                <DialogTitle>{t('devices.deviceConfiguration')}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">{t('devices.provisioningHelp')}</p>
              <div className="space-y-4 py-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="device-settings-name">{t('devices.deviceName')}</Label>
                    <Input
                      id="device-settings-name"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device-settings-type">{t('devices.type')}</Label>
                    <Input
                      id="device-settings-type"
                      value={provisioningDevice.type || '—'}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="device-settings-code">{t('devices.logicalDeviceCode')}</Label>
                    <Input id="device-settings-code" value={provisioningDevice.code} readOnly />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="device-settings-location">{t('devices.location')}</Label>
                    <Input
                      id="device-settings-location"
                      value={editLocation}
                      onChange={(event) => setEditLocation(event.target.value)}
                      placeholder={t('devices.locationPlaceholder')}
                      maxLength={120}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="device-settings-threshold">{t('devices.alertThreshold')}</Label>
                    <Input
                      id="device-settings-threshold"
                      type="number"
                      min="0.01"
                      value={threshold}
                      onChange={(event) => setThreshold(event.target.value)}
                    />
                    <p className="text-xs text-gray-500">{t('devices.alertThresholdHelp')}</p>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="size-4 text-blue-600" />
                    <p className="text-sm font-medium">{t('devices.connectionSettings')}</p>
                  </div>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="text-gray-500">{t('devices.wifiNetwork')}:</span>{' '}
                      {bleSsid || provisioningDevice.wifiSsid || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">{t('devices.wifiIp')}:</span>{' '}
                      {bleIp || provisioningDevice.lastIp || '—'}
                    </p>
                    <p>
                      <span className="text-gray-500">RSSI:</span>{' '}
                      {bleRssi ?? provisioningDevice.wifiRssiDbm ?? '—'}
                      {(bleRssi ?? provisioningDevice.wifiRssiDbm) !== null &&
                      (bleRssi ?? provisioningDevice.wifiRssiDbm) !== undefined
                        ? ' dBm'
                        : ''}
                    </p>
                    <p>
                      <span className="text-gray-500">{t('devices.wifiPassword')}:</span>{' '}
                      {t('devices.wifiPasswordNotShown')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-blue-950">
                        {t('devices.bleProvisioning')}
                      </p>
                      <p className="text-xs text-blue-800">
                        {bleDeviceName || t('devices.bleNotConnected')}
                        {bleState ? ` · ${bleState}` : ''}
                      </p>
                    </div>
                    {isWifiConfigured ? (
                      <Badge variant="default">
                        <Wifi className="mr-1 size-3" />
                        {t('devices.wifiConfigured')}
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void connectBle()}
                        disabled={bleConnecting}
                      >
                        {bleConnecting ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                          <Bluetooth className="mr-2 size-4" />
                        )}
                        {bleConnection ? t('devices.bleConnected') : t('devices.connectBle')}
                      </Button>
                    )}
                  </div>
                  {bleConnection && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-blue-200 bg-white p-3 text-xs text-blue-950 sm:col-span-2">
                        <p>
                          {t('devices.logicalDeviceCode')}:{' '}
                          <strong>{provisioningDevice?.code}</strong>
                        </p>
                        <p className="mt-1 break-all">
                          {t('devices.detectedHardware')}:{' '}
                          <strong>{provisioningHardwareId || '—'}</strong>
                        </p>
                        <p className="mt-1 text-blue-800">{t('devices.claimHardwareHelp')}</p>
                        <Button
                          type="button"
                          className="mt-3"
                          size="sm"
                          onClick={() => void claimHardware()}
                          disabled={
                            hardwareClaiming ||
                            !provisioningHardwareId.trim() ||
                            provisioningDevice?.hardwareId === provisioningHardwareId.trim()
                          }
                        >
                          {hardwareClaiming ? t('common.loading') : t('devices.claimHardware')}
                        </Button>
                      </div>
                      {!isWifiConfigured && (
                        <>
                          <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="ble-wifi-ssid">{t('devices.bleSsid')}</Label>
                            <Input
                              id="ble-wifi-ssid"
                              value={bleSsid}
                              onChange={(event) => setBleSsid(event.target.value)}
                              maxLength={32}
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-1 sm:col-span-2">
                            <Label htmlFor="ble-wifi-password">{t('devices.blePassword')}</Label>
                            <Input
                              id="ble-wifi-password"
                              type="password"
                              value={blePassword}
                              onChange={(event) => setBlePassword(event.target.value)}
                              maxLength={63}
                              autoComplete="new-password"
                            />
                            <p className="text-xs text-blue-800">
                              {t('devices.wifiPasswordNotShown')}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ble-mqtt-host">{t('devices.bleMqttHost')}</Label>
                            <Input
                              id="ble-mqtt-host"
                              value={bleMqttHost}
                              onChange={(event) => setBleMqttHost(event.target.value)}
                              placeholder="192.168.1.10"
                              maxLength={253}
                              autoComplete="off"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ble-mqtt-port">{t('devices.bleMqttPort')}</Label>
                            <Input
                              id="ble-mqtt-port"
                              type="number"
                              min="1"
                              max="65535"
                              value={bleMqttPort}
                              onChange={(event) => setBleMqttPort(event.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            className="sm:col-span-2"
                            onClick={() => void sendBleConfiguration()}
                            disabled={bleWriting}
                          >
                            {bleWriting ? t('common.loading') : t('devices.sendBleConfiguration')}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 rounded-lg border bg-slate-50 p-3">
                  <Label>{t('devices.hardwareId')}</Label>
                  <p className="break-all text-sm text-gray-700">
                    {provisioningHardwareId || t('devices.hardwareIdPending')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-provisioning-status">
                    {t('devices.provisioningStatus')}
                  </Label>
                  <select
                    id="device-provisioning-status"
                    className="h-10 w-full rounded-md border px-3"
                    value={provisioningStatus}
                    onChange={(event) => setProvisioningStatus(event.target.value)}
                  >
                    {[
                      'PENDING',
                      'BLE_READY',
                      'WIFI_CONNECTED',
                      'MQTT_CONNECTED',
                      'COMPLETE',
                      'FAILED',
                    ].map((status) => (
                      <option key={status} value={status}>
                        {t(`devices.provisioningStates.${status.toLowerCase()}`)}
                      </option>
                    ))}
                  </select>
                </div>
                {provisioningStatus === 'FAILED' && (
                  <div className="space-y-2">
                    <Label htmlFor="device-provisioning-error">
                      {t('devices.provisioningError')}
                    </Label>
                    <Input
                      id="device-provisioning-error"
                      value={provisioningError}
                      onChange={(event) => setProvisioningError(event.target.value)}
                      maxLength={255}
                    />
                  </div>
                )}
                <div className="rounded-lg border border-dashed p-3 text-xs text-gray-600">
                  <p>
                    {t('devices.bleServiceUuid')}: <code>4fafc201-1fb5-459e-8fcc-c5c9c331914b</code>
                  </p>
                  <p>
                    {t('devices.bleCharacteristicUuid')}:{' '}
                    <code>beb5483e-36e1-4688-b7f5-ea07361b26a8</code>
                  </p>
                  <p>
                    {t('devices.bleStatusCharacteristicUuid')}:{' '}
                    <code>beb5483e-36e1-4688-b7f5-ea07361b26a9</code>
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center text-blue-700 hover:underline"
                    onClick={() =>
                      void navigator.clipboard?.writeText(
                        JSON.stringify({
                          hardwareId: provisioningHardwareId.trim() || undefined,
                          provisioningStatus,
                        })
                      )
                    }
                  >
                    <Copy className="mr-1 size-3" /> {t('devices.copyProvisioningData')}
                  </button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentDevice = provisioningDevice;
                    closeProvisioning();
                    openHistory(currentDevice);
                  }}
                >
                  <History className="mr-2 size-4" />
                  {t('devices.viewHistory')}
                </Button>
                <Button type="submit" disabled={provisioningSaving}>
                  {provisioningSaving ? t('common.loading') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {historyDevice && (
        <Dialog
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setHistoryDevice(null);
          }}
        >
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {t('devices.historyTitle')}: {historyDevice.name}
              </DialogTitle>
            </DialogHeader>
            {historyLoading ? (
              <div className="flex min-h-32 items-center justify-center text-sm text-gray-600">
                <Loader2 className="mr-2 size-5 animate-spin" />
                {t('common.loading')}
              </div>
            ) : history.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-gray-600">
                {t('devices.historyEmpty')}
              </p>
            ) : (
              <>
                <div className="max-h-96 overflow-auto rounded-lg border">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-xs text-gray-600">
                      <tr>
                        <th className="px-3 py-2">{t('devices.lastReading')}</th>
                        <th className="px-3 py-2">{t('devices.currentFlow')}</th>
                        <th className="px-3 py-2">{t('devices.totalVolume')}</th>
                        <th className="px-3 py-2">{t('devices.pulses')}</th>
                        <th className="px-3 py-2">RSSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((reading) => (
                        <tr key={reading.readingId} className="border-t">
                          <td className="px-3 py-2">
                            {new Date(reading.measuredAt).toLocaleString(dateLocale)}
                          </td>
                          <td className="px-3 py-2">
                            {reading.flowRateLpm?.toFixed(2) ?? '—'} L/min
                          </td>
                          <td className="px-3 py-2">{reading.totalLiters?.toFixed(2) ?? '—'} L</td>
                          <td className="px-3 py-2">{reading.pulses ?? '—'}</td>
                          <td className="px-3 py-2">{reading.wifiRssiDbm ?? '—'} dBm</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {historyPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-sm text-gray-600">
                      {t('devices.pageOf', {
                        page: historyPagination.page,
                        totalPages: historyPagination.totalPages,
                      })}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={historyPage <= 1 || historyLoading}
                        onClick={() => void loadHistory(historyDevice.deviceId, historyPage - 1)}
                      >
                        {t('common.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={historyPage >= historyPagination.totalPages || historyLoading}
                        onClick={() => void loadHistory(historyDevice.deviceId, historyPage + 1)}
                      >
                        {t('common.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

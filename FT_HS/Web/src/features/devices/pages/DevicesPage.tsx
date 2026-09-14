import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
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
import { Droplets, Plus, Trash2, Wifi, WifiOff } from 'lucide-react';
import { devicesApi } from '@shared/http/httpClient';
import { toast } from 'sonner';
import { can } from '@shared/config/authorization';

type Device = {
  deviceId: string;
  code: string;
  name: string;
  type?: string;
  status: string;
  alertThreshold?: number | null;
  lastConnectionAt?: string | null;
  homeId: string;
};
type Home = { homeId: string; name: string };

type DeviceManagementProps = {
  permissions: string[];
  homeId?: string;
  homes: Home[];
  onHomeChange: (homeId: string) => void;
};

class DeviceErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>No fue posible abrir Dispositivos IoT</CardTitle>
            <CardDescription>Recarga la página. El resto de HidroSmart continúa disponible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Recargar página</Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

function DeviceManagementContent({
  permissions,
  homeId,
  homes,
  onHomeChange,
}: DeviceManagementProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [threshold, setThreshold] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const canManage = can(permissions, 'devices.manage');

  const loadDevices = (id = homeId) => {
    if (!id) {
      setDevices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    devicesApi
      .list(id)
      .then(({ data }) => {
        const items = Array.isArray(data) ? data : [];
        setDevices(items.map((device) => ({ ...device, homeId: id })) as Device[]);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : 'No se pudieron cargar los dispositivos';
        setDevices([]);
        setLoadError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadDevices();
  }, [homeId]);

  const register = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!homeId) {
      toast.error('Selecciona un hogar antes de registrar un dispositivo');
      return;
    }
    const form = new FormData(event.currentTarget);
    try {
      await devicesApi.register({
        homeId,
        code: form.get('code'),
        name: form.get('name'),
        type: form.get('type'),
        alertThreshold: Number(form.get('threshold')) || null,
      });
      toast.success('Dispositivo registrado');
      setOpen(false);
      event.currentTarget.reset();
      loadDevices();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar el dispositivo');
    }
  };
  const updateThreshold = async () => {
    if (!selectedDevice || !threshold) return;
    try {
      await devicesApi.update(selectedDevice.deviceId, { alertThreshold: Number(threshold) });
      setDevices((current) =>
        current.map((device) =>
          device.deviceId === selectedDevice.deviceId
            ? { ...device, alertThreshold: Number(threshold) }
            : device
        )
      );
      setSelectedDevice(null);
      toast.success('Umbral actualizado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el umbral');
    }
  };
  const unlink = async (device: Device) => {
    try {
      await devicesApi.unlink(device.deviceId, homeId);
      setDevices((current) => current.filter((item) => item.deviceId !== device.deviceId));
      toast.success('Dispositivo desvinculado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo desvincular el dispositivo');
    }
  };
  const online = devices.filter((device) =>
    ['active', 'online'].includes(String(device.status).toLowerCase())
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl">Dispositivos IoT</h2>
          <p className="text-gray-600">Dispositivos asociados al hogar seleccionado.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <select
            className="h-11 w-full rounded-md border px-3 sm:w-auto"
            value={homeId}
            onChange={(event) => onHomeChange(event.target.value)}
          >
            <option value="">Seleccionar hogar</option>
            {homes.map((home) => (
              <option key={home.homeId} value={home.homeId}>
                {home.name}
              </option>
            ))}
          </select>
          {canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 size-4" />
                  Registrar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={register}>
                  <DialogHeader>
                    <DialogTitle>Registrar dispositivo</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input name="code" placeholder="Código del dispositivo" required />
                    <Input name="name" placeholder="Nombre" required />
                    <Input name="type" placeholder="Tipo" required />
                    <Input name="threshold" type="number" placeholder="Umbral de alerta" />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Guardar</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle>{devices.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>En línea</CardDescription>
            <CardTitle className="text-green-600">{online}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Fuera de línea</CardDescription>
            <CardTitle className="text-red-600">{Math.max(devices.length - online, 0)}</CardTitle>
          </CardHeader>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-sm text-gray-500">Cargando dispositivos...</p>
        ) : loadError ? (
          <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {loadError}
          </div>
        ) : devices.length ? (
          devices.map((device) => {
            const isOnline = ['active', 'online'].includes(String(device.status).toLowerCase());
            return (
              <Card key={device.deviceId}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <Droplets className="size-6 text-blue-600" />
                    <Badge variant={isOnline ? 'default' : 'destructive'}>
                      {isOnline ? (
                        <Wifi className="mr-1 size-3" />
                      ) : (
                        <WifiOff className="mr-1 size-3" />
                      )}
                      {device.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <CardDescription>
                    {device.code} · {device.type || '—'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">Umbral: {device.alertThreshold ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    Última conexión:{' '}
                    {device.lastConnectionAt
                      ? new Date(device.lastConnectionAt).toLocaleString('es-CO')
                      : '—'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDevice(device);
                          setThreshold(String(device.alertThreshold ?? ''));
                        }}
                      >
                        Editar umbral
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unlink(device)}
                        aria-label="Desvincular"
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
          <p className="col-span-full text-sm text-gray-500">No hay dispositivos registrados.</p>
        )}
      </div>
      {selectedDevice && (
        <Dialog open onOpenChange={() => setSelectedDevice(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Actualizar umbral</DialogTitle>
            </DialogHeader>
            <Label htmlFor="device-threshold">Umbral</Label>
            <Input
              id="device-threshold"
              type="number"
              value={threshold}
              onChange={(event) => setThreshold(event.target.value)}
            />
            <DialogFooter>
              <Button onClick={updateThreshold}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export function DeviceManagement(props: DeviceManagementProps) {
  return (
    <DeviceErrorBoundary>
      <DeviceManagementContent {...props} />
    </DeviceErrorBoundary>
  );
}

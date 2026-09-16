import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { devicesApi, homesApi } from '@shared/http/httpClient';
import { Battery, Droplets, Settings, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function TechnicianPanel() {
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [factor, setFactor] = useState('');
  const [offset, setOffset] = useState('');

  useEffect(() => {
    homesApi
      .list()
      .then(async ({ data }) => {
        const responses = await Promise.all(
          (data as any[]).map((home) => devicesApi.list(home.homeId))
        );
        setDevices(responses.flatMap((response) => response.data as any[]));
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : 'No se pudieron cargar los dispositivos'
        )
      );
  }, []);

  const saveCalibration = async () => {
    if (!selectedDeviceId || !factor || !offset) {
      toast.error('Selecciona un dispositivo y completa la calibración');
      return;
    }
    try {
      await devicesApi.updateConfig(selectedDeviceId, {
        calibrationFactor: Number(factor),
        calibrationOffset: Number(offset),
        reason: 'Calibración desde panel técnico',
      });
      toast.success('Calibración guardada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar la calibración');
    }
  };

  const online = devices.filter((device) =>
    ['active', 'online'].includes(String(device.status).toLowerCase())
  ).length;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Panel técnico</h2>
        <p className="text-gray-600">Estado y configuración de dispositivos registrados.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle>
              <Droplets className="mr-2 inline size-5" />
              {devices.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>En línea</CardDescription>
            <CardTitle>
              <Wifi className="mr-2 inline size-5 text-green-600" />
              {online}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Fuera de línea</CardDescription>
            <CardTitle>
              <WifiOff className="mr-2 inline size-5 text-red-600" />
              {Math.max(devices.length - online, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos</CardTitle>
          <CardDescription>Información consultada desde el backend.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {devices.length ? (
            devices.map((device) => (
              <div
                key={device.deviceId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-gray-600">
                    {device.code} · {device.type}
                  </p>
                </div>
                <Badge
                  variant={
                    ['active', 'online'].includes(String(device.status).toLowerCase())
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {device.status}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay dispositivos registrados.</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            <Settings className="mr-2 inline size-5" />
            Calibración
          </CardTitle>
          <CardDescription>Actualiza el factor y offset de un dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor="technician-device">Dispositivo</Label>
            <select
              id="technician-device"
              className="mt-2 h-10 w-full rounded-md border px-3"
              value={selectedDeviceId}
              onChange={(event) => setSelectedDeviceId(event.target.value)}
            >
              <option value="">Seleccionar</option>
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="calibration-factor">Factor</Label>
            <Input
              id="calibration-factor"
              type="number"
              value={factor}
              onChange={(event) => setFactor(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="calibration-offset">Offset</Label>
            <Input
              id="calibration-offset"
              type="number"
              value={offset}
              onChange={(event) => setOffset(event.target.value)}
            />
          </div>
          <Button className="sm:col-span-4" onClick={saveCalibration}>
            <Battery className="mr-2 size-4" />
            Guardar calibración
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

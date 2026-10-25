import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Building2, Droplets, Users, Wifi, WifiOff } from 'lucide-react';
import { homesApi, devicesApi } from '@shared/http/httpClient';
import { toast } from 'sonner';

export function AdminPanel() {
  const [homes, setHomes] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    homesApi
      .list()
      .then(async ({ data }) => {
        const loadedHomes = data as any[];
        setHomes(loadedHomes);
        const responses = await Promise.all(
          loadedHomes.map((home) => devicesApi.list(home.homeId))
        );
        setDevices(responses.flatMap((response) => response.data as any[]));
      })
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : 'No se pudo cargar el panel administrativo'
        )
      );
  }, []);

  const online = devices.filter((device) =>
    ['active', 'online'].includes(String(device.status).toLowerCase())
  ).length;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl">Panel administrativo</h2>
        <p className="text-gray-600">Resumen de los recursos visibles para tu cuenta.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Hogares</CardDescription>
            <CardTitle>
              <Building2 className="mr-2 inline size-5 text-purple-600" />
              {homes.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Dispositivos</CardDescription>
            <CardTitle>
              <Droplets className="mr-2 inline size-5 text-cyan-600" />
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
          <CardTitle>Hogares accesibles</CardTitle>
          <CardDescription>Datos obtenidos desde /homes y /devices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {homes.length ? (
            homes.map((home) => (
              <div
                key={home.homeId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">{home.name}</p>
                  <p className="text-sm text-gray-600">
                    {home.city} · estrato {home.tier ?? '—'}
                  </p>
                </div>
                <Users className="size-5 text-gray-400" />
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay hogares disponibles.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

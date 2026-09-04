import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Label } from '@shared/ui/label';
import { Badge } from '@shared/ui/badge';
import { Plane } from 'lucide-react';
import { homesApi, vacationApi } from '@shared/http/httpClient';
import { toast } from 'sonner';

type Vacation = { active?: boolean; isActive?: boolean; startedAt?: string; endedAt?: string };

export function VacationMode() {
  const [homeId, setHomeId] = useState('');
  const [vacation, setVacation] = useState<Vacation | null>(null);
  const [startedAt, setStartedAt] = useState('');
  const [endedAt, setEndedAt] = useState('');

  const load = (id: string) =>
    vacationApi
      .get(id)
      .then(({ data }) => {
        const current = data as Vacation | null;
        setVacation(current);
        setStartedAt(current?.startedAt?.slice(0, 10) || '');
        setEndedAt(current?.endedAt?.slice(0, 10) || '');
      })
      .catch(() => setVacation(null));
  useEffect(() => {
    homesApi
      .list()
      .then(({ data }) => {
        const id = String((data as any[])[0]?.homeId || '');
        setHomeId(id);
        if (id) load(id);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los hogares')
      );
  }, []);

  const save = async () => {
    if (!homeId || !startedAt || !endedAt || startedAt >= endedAt) {
      toast.error('Selecciona un rango de fechas válido');
      return;
    }
    try {
      const response = await vacationApi.save(homeId, {
        active: true,
        startedAt,
        endedAt,
        notifyOnReturn: true,
      });
      setVacation(response.data as Vacation);
      toast.success('Modo vacaciones activado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo activar el modo vacaciones');
    }
  };
  const disable = async () => {
    try {
      await vacationApi.remove(homeId);
      setVacation(null);
      setStartedAt('');
      setEndedAt('');
      toast.success('Modo vacaciones desactivado');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'No se pudo desactivar el modo vacaciones'
      );
    }
  };
  const active = Boolean(vacation?.isActive ?? vacation?.active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Plane className="size-6 text-blue-600" />
            <div>
              <CardTitle>Modo vacaciones</CardTitle>
              <CardDescription>
                Configuración persistida para el hogar seleccionado.
              </CardDescription>
            </div>
            <Badge className="ml-auto">{active ? 'Activo' : 'Inactivo'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="vacation-start">Fecha de inicio</Label>
              <input
                id="vacation-start"
                type="date"
                className="mt-2 h-10 w-full rounded-md border px-3"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="vacation-end">Fecha de fin</Label>
              <input
                id="vacation-end"
                type="date"
                className="mt-2 h-10 w-full rounded-md border px-3"
                value={endedAt}
                onChange={(event) => setEndedAt(event.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={save} disabled={active}>
              Activar modo vacaciones
            </Button>
            <Button variant="outline" onClick={disable} disabled={!active}>
              Desactivar
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-gray-500">
        El backend actualmente expone el estado vigente; no se muestra historial ficticio.
      </p>
    </div>
  );
}

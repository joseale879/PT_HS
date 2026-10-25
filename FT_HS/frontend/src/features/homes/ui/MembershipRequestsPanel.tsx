import { useEffect, useState } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { homesApi, MembershipRequest } from '@shared/http/apiClient';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

type HomeOption = { homeId: string; name: string; status?: string };

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(value)
  );
}

/** Flujo real de solicitudes de ingreso; no usa usuarios ni hogares quemados. */
export function MembershipRequestsPanel() {
  const [homes, setHomes] = useState<HomeOption[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadRequests = async (homeId: string) => {
    if (!homeId) return;
    try {
      const response = await homesApi.membershipRequests(homeId);
      setRequests(response.data ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las solicitudes');
    }
  };

  useEffect(() => {
    homesApi
      .list()
      .then((response) => {
        const available = (response.data as Array<Record<string, unknown>>).map((home) => ({
          homeId: String(home.homeId),
          name: String(home.name ?? 'Hogar'),
          status: String(home.status ?? ''),
        }));
        setHomes(available);
        if (available[0]) setSelectedHomeId(available[0].homeId);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los hogares')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedHomeId) loadRequests(selectedHomeId);
  }, [selectedHomeId]);

  const requestAccess = async () => {
    if (!selectedHomeId) return;
    setBusyId('new');
    try {
      await homesApi.requestMembership(selectedHomeId);
      await loadRequests(selectedHomeId);
      toast.success('Solicitud enviada. El dueño del hogar debe aprobarla.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo enviar la solicitud');
    } finally {
      setBusyId(null);
    }
  };

  const answerRequest = async (requestId: string, status: 'Approved' | 'Rejected') => {
    setBusyId(requestId);
    try {
      await homesApi.answerMembershipRequest(requestId, status);
      await loadRequests(selectedHomeId);
      toast.success(status === 'Approved' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo responder la solicitud');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return null;
  if (!homes.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes de membresía</CardTitle>
        <CardDescription>
          Envía una solicitud para unirte a un hogar o gestiona las solicitudes pendientes de tus
          hogares.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="membership-home">Hogar</Label>
            <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
              <SelectTrigger id="membership-home">
                <SelectValue placeholder="Selecciona un hogar" />
              </SelectTrigger>
              <SelectContent>
                {homes.map((home) => (
                  <SelectItem key={home.homeId} value={home.homeId}>
                    {home.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={requestAccess}
            disabled={busyId !== null}
          >
            <UserPlus className="mr-2 size-4" /> Solicitar ingreso
          </Button>
        </div>

        {!requests.length ? (
          <Alert>
            <AlertDescription>No hay solicitudes registradas para este hogar.</AlertDescription>
          </Alert>
        ) : (
          requests.map((request) => (
            <div
              key={request.requestId}
              className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">
                  {request.fullName || request.email || `Usuario ${request.userId}`}
                </p>
                {request.email && <p className="text-xs text-gray-600">{request.email}</p>}
                <p className="text-xs text-gray-500">
                  Solicitada: {formatDate(request.requestedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={request.status === 'Pending' ? 'secondary' : 'outline'}>
                  {request.status}
                </Badge>
                {request.status === 'Pending' && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => answerRequest(request.requestId, 'Approved')}
                      disabled={busyId !== null}
                    >
                      <Check className="mr-1 size-4" /> Aprobar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => answerRequest(request.requestId, 'Rejected')}
                      disabled={busyId !== null}
                    >
                      <X className="mr-1 size-4" /> Rechazar
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

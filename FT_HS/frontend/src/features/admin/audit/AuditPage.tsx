import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Button } from '@shared/ui/button';
import { Shield } from 'lucide-react';
import { auditApi } from '@shared/http/httpClient';
import { toast } from 'sonner';

type AuditEvent = {
  auditId: string;
  action: string;
  tableName?: string;
  recordId?: string;
  description?: string;
  sourceIp?: string;
  createdAt: string;
};

export function AuditLog() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [search, setSearch] = useState('');
  const load = () =>
    auditApi
      .logs('pageSize=100')
      .then(({ data }) => setEvents(data as AuditEvent[]))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar la auditoría')
      );
  useEffect(() => {
    void load();
  }, []);
  const filtered = events.filter((event) =>
    `${event.action} ${event.tableName || ''} ${event.description || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="size-6 text-purple-600" />
            <div>
              <CardTitle>Registro de auditoría</CardTitle>
              <CardDescription>Eventos registrados por el backend.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Buscar eventos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Acción</th>
                  <th className="p-3">Tabla</th>
                  <th className="p-3">Descripción</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr key={event.auditId} className="border-b">
                    <td className="p-3">{new Date(event.createdAt).toLocaleString('es-CO')}</td>
                    <td className="p-3">{event.action}</td>
                    <td className="p-3">{event.tableName || '—'}</td>
                    <td className="p-3">{event.description || '—'}</td>
                    <td className="p-3">{event.sourceIp || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && (
            <p className="text-sm text-gray-500">No hay eventos para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

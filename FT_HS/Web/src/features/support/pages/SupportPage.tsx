import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Headphones, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog';
import { supportApi } from '@shared/http/httpClient';
import { toast } from 'sonner';

type Ticket = {
  ticketId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
};
const statusLabel: Record<string, string> = {
  Abierto: 'Abierto',
  'En Proceso': 'En proceso',
  Resuelto: 'Resuelto',
  Cerrado: 'Cerrado',
};

export function SupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  const load = () =>
    supportApi
      .list()
      .then(({ data }) => setTickets(data as Ticket[]))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los tickets')
      );
  useEffect(() => {
    Promise.all([supportApi.categories(), supportApi.list()])
      .then(([categoryResponse, ticketResponse]) => {
        setCategories(categoryResponse.data as Array<{ categoryId: string; name: string }>);
        setTickets(ticketResponse.data as Ticket[]);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar soporte')
      );
  }, []);

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await supportApi.create({
        title: form.get('title'),
        description: form.get('description'),
        category: form.get('category'),
        priority: form.get('priority'),
      });
      toast.success('Ticket creado');
      setOpen(false);
      event.currentTarget.reset();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el ticket');
    }
  };

  const visible = tickets.filter((ticket) => filter === 'all' || ticket.status === filter);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Soporte técnico</h2>
          <p className="text-gray-600">Tickets consultados y persistidos en el backend.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Nuevo ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={create}>
              <DialogHeader>
                <DialogTitle>Crear ticket</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input name="title" placeholder="Título" required />
                <select name="category" className="h-10 w-full rounded-md border px-3" required>
                  <option value="">Categoría</option>
                  {categories.map((category) => (
                    <option key={category.categoryId} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  name="priority"
                  className="h-10 w-full rounded-md border px-3"
                  defaultValue="Media"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                </select>
                <Textarea name="description" placeholder="Describe el problema" required />
              </div>
              <DialogFooter>
                <Button type="submit">Crear ticket</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'Abierto', 'En Proceso', 'Cerrado'].map((value) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? 'Todos' : statusLabel[value] || value}
          </Button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Headphones className="mr-2 inline size-5" />
            Mis tickets
          </CardTitle>
          <CardDescription>{visible.length} tickets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visible.length ? (
            visible.map((ticket) => (
              <div key={ticket.ticketId} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{ticket.description}</p>
                  </div>
                  <Badge>{statusLabel[ticket.status] || ticket.status}</Badge>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {ticket.category} · {ticket.priority} ·{' '}
                  {new Date(ticket.createdAt).toLocaleString('es-CO')}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay tickets para mostrar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

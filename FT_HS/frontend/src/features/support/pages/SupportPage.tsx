import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Badge } from '@shared/ui/badge';
import { Eye, Headphones, Loader2, MessageSquare, Plus, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
type TicketResponse = {
  responseId: string;
  message: string;
  createdAt: string;
};
export function SupportTickets({ management = false }: { management?: boolean }) {
  const { t } = useTranslation();
  const statusLabel: Record<string, string> = {
    Abierto: t('support.open'),
    'En Proceso': t('support.inProgress'),
    Resuelto: t('support.resolved'),
    Cerrado: t('support.closed'),
  };
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Array<{ categoryId: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responses, setResponses] = useState<TicketResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);

  const load = () =>
    supportApi
      .list()
      .then(({ data }) => setTickets(data as Ticket[]))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : t('support.ticketsLoadError'))
      );
  useEffect(() => {
    const ticketRequest = supportApi.list();
    const request = management ? Promise.resolve(null) : supportApi.categories();
    Promise.all([request, ticketRequest])
      .then(([categoryResponse, ticketResponse]) => {
        if (categoryResponse) {
          setCategories(categoryResponse.data as Array<{ categoryId: string; name: string }>);
        }
        setTickets(ticketResponse.data as Ticket[]);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : t('support.supportLoadError'))
      );
  }, [management, t]);

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
      toast.success(t('support.ticketCreatedShort'));
      setOpen(false);
      event.currentTarget.reset();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('support.ticketCreateError'));
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    setUpdatingTicketId(ticketId);
    try {
      await supportApi.update(ticketId, { status });
      toast.success(t('support.statusUpdated'));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('support.ticketStatusError'));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const openTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setResponses([]);
    setResponseMessage('');
    setResponsesLoading(true);
    try {
      const response = await supportApi.responses(ticket.ticketId);
      setResponses(response.data as TicketResponse[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('support.responsesLoadError'));
    } finally {
      setResponsesLoading(false);
    }
  };

  const closeTicket = (open: boolean) => {
    if (!open) {
      setSelectedTicket(null);
      setResponses([]);
      setResponseMessage('');
    }
  };

  const sendResponse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicket || !responseMessage.trim()) return;
    setSendingResponse(true);
    try {
      const response = await supportApi.respond(selectedTicket.ticketId, responseMessage.trim());
      setResponses((current) => [...current, response.data as TicketResponse]);
      setResponseMessage('');
      toast.success(t('support.responseSent'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('support.responseSendError'));
    } finally {
      setSendingResponse(false);
    }
  };

  const visible = tickets.filter((ticket) => filter === 'all' || ticket.status === filter);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">
            {management ? t('support.managementTitle') : t('support.title')}
          </h2>
          <p className="text-gray-600">
            {management ? t('support.managementDescription') : t('support.subtitle')}
          </p>
        </div>
        {!management && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                {t('support.newTicket')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={create}>
                <DialogHeader>
                  <DialogTitle>{t('support.createSupportTicket')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input name="title" placeholder={t('support.problemTitle')} required />
                  <select name="category" className="h-10 w-full rounded-md border px-3" required>
                    <option value="">{t('support.category')}</option>
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
                    <option value="Baja">{t('support.low')}</option>
                    <option value="Media">{t('support.medium')}</option>
                    <option value="Alta">{t('support.high')}</option>
                  </select>
                  <Textarea
                    name="description"
                    placeholder={t('support.descriptionPlaceholder')}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{t('support.createTicket')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'Abierto', 'En Proceso', 'Resuelto', 'Cerrado'].map((value) => (
          <Button
            key={value}
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(value)}
          >
            {value === 'all'
              ? t('support.all', { count: tickets.length })
              : statusLabel[value] || value}
          </Button>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <Headphones className="mr-2 inline size-5" />
            {management ? t('support.ticketsReceived') : t('support.myTickets')}
          </CardTitle>
          <CardDescription>{t('support.ticketCount', { count: visible.length })}</CardDescription>
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
                  <div className="flex items-center gap-2">
                    <Badge>{statusLabel[ticket.status] || ticket.status}</Badge>
                    {management && (
                      <select
                        aria-label={t('support.ticketStatusAria', { title: ticket.title })}
                        className="h-8 rounded-md border px-2 text-xs"
                        value={ticket.status}
                        disabled={updatingTicketId === ticket.ticketId}
                        onChange={(event) => updateStatus(ticket.ticketId, event.target.value)}
                      >
                        <option value="Abierto">{t('support.open')}</option>
                        <option value="En Proceso">{t('support.inProgress')}</option>
                        <option value="Resuelto">{t('support.resolved')}</option>
                        <option value="Cerrado">{t('support.closed')}</option>
                      </select>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {ticket.category} · {ticket.priority} ·{' '}
                  {new Date(ticket.createdAt).toLocaleString('es-CO')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => void openTicket(ticket)}
                >
                  {management ? (
                    <MessageSquare className="mr-1 size-4" />
                  ) : (
                    <Eye className="mr-1 size-4" />
                  )}
                  {management ? t('support.openTicket') : t('support.viewDetail')}
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">{t('support.noTicketsToShow')}</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedTicket)} onOpenChange={closeTicket}>
        <DialogContent>
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {t('support.ticketDetail')}: {selectedTicket.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedTicket.category} · {selectedTicket.priority} ·{' '}
                  {statusLabel[selectedTicket.status] || selectedTicket.status}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="rounded-md bg-muted p-3 text-sm">{selectedTicket.description}</p>
                <div className="space-y-2">
                  <h3 className="font-medium">{t('support.responseHistory')}</h3>
                  {responsesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Loader2 className="size-4 animate-spin" /> {t('support.loadingResponses')}
                    </div>
                  ) : responses.length ? (
                    responses.map((response) => (
                      <div key={response.responseId} className="rounded-md border p-3 text-sm">
                        <p>{response.message}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          {new Date(response.createdAt).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t('support.noResponses')}</p>
                  )}
                </div>
                <form onSubmit={sendResponse} className="space-y-3">
                  <Textarea
                    value={responseMessage}
                    onChange={(event) => setResponseMessage(event.target.value)}
                    placeholder={t('support.responsePlaceholder')}
                    maxLength={5000}
                    required
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={sendingResponse || !responseMessage.trim()}>
                      {sendingResponse ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 size-4" />
                      )}
                      {t('support.sendResponse')}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

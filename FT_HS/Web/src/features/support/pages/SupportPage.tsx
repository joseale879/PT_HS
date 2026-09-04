import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Textarea } from '@shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Badge } from '@shared/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/ui/dialog';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Headphones, Plus, Clock, CheckCircle2, XCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

// RF35 - Soporte técnico
export function SupportTickets() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // RF35.3 - Tickets simulados con estados
  const tickets = [
    {
      id: 'TKT-2025-001',
      title: t('support.sample.deviceDisconnectedTitle'),
      description: t('support.sample.deviceDisconnectedDesc'),
      category: 'device',
      priority: 'high',
      status: 'open',
      createdAt: '2025-10-28T09:00:00',
      updatedAt: '2025-10-28T09:00:00',
      responses: []
    },
    {
      id: 'TKT-2025-002',
      title: t('support.sample.monthlyReportErrorTitle'),
      description: t('support.sample.monthlyReportErrorDesc'),
      category: 'reports',
      priority: 'medium',
      status: 'in_progress',
      createdAt: '2025-10-27T14:30:00',
      updatedAt: '2025-10-28T10:15:00',
      assignedTo: t('roles.technician'),
      responses: [
        {
          from: t('support.supportTeam'),
          message: t('support.sample.problemIdentified'),
          timestamp: '2025-10-27T16:00:00'
        }
      ]
    },
    {
      id: 'TKT-2025-003',
      title: t('support.sample.ratesQuestionTitle'),
      description: t('support.sample.ratesQuestionDesc'),
      category: 'question',
      priority: 'low',
      status: 'closed',
      createdAt: '2025-10-25T11:00:00',
      updatedAt: '2025-10-26T09:00:00',
      resolvedAt: '2025-10-26T09:00:00',
      responses: [
        {
          from: t('support.supportTeam'),
          message: t('support.sample.ratesAnswer'),
          timestamp: '2025-10-25T15:00:00'
        }
      ]
    },
    {
      id: 'TKT-2025-004',
      title: t('support.sample.undetectedLeakTitle'),
      description: t('support.sample.undetectedLeakDesc'),
      category: 'detection',
      priority: 'high',
      status: 'in_progress',
      createdAt: '2025-10-24T08:00:00',
      updatedAt: '2025-10-28T08:00:00',
      assignedTo: t('support.specialistTechnician'),
      responses: [
        {
          from: t('support.supportTeam'),
          message: t('support.sample.calibrationReview'),
          timestamp: '2025-10-24T10:00:00'
        },
        {
          from: 'Juan Pérez',
          message: t('support.sample.deviceCode'),
          timestamp: '2025-10-24T11:00:00'
        },
        {
          from: t('support.specialistTechnician'),
          message: t('support.sample.visitScheduled'),
          timestamp: '2025-10-25T09:00:00'
        }
      ]
    }
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { label: t('support.open'), icon: Clock, color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'in_progress':
        return { label: t('support.inProgress'), icon: MessageSquare, color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'closed':
        return { label: t('support.closed'), icon: CheckCircle2, color: 'bg-green-100 text-green-800 border-green-200' };
      default:
        return { label: t('common.other'), icon: XCircle, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // RF35.1 - Crear nuevo ticket
  const handleCreateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // RF35.2 - Generar número de ticket
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    
    console.log('Nuevo ticket creado:', {
      ticketNumber,
      title: formData.get('title'),
      category: formData.get('category'),
      priority: formData.get('priority'),
      description: formData.get('description'),
      timestamp: new Date().toISOString()
    });

    toast.success(t('support.ticketCreated', { ticketNumber }), {
      description: t('support.ticketCreatedDesc')
    });

    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const filteredTickets = tickets.filter(ticket => {
    if (activeTab === 'all') return true;
    return ticket.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg sm:p-3">
                <Headphones className="size-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <CardTitle>{t('support.title')}</CardTitle>
                <CardDescription>
                  {t('support.subtitle')}
                </CardDescription>
              </div>
            </div>
            {/* RF35.1 - Reportar problema */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="size-4" />
                  {t('support.newTicket')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleCreateTicket}>
                  <DialogHeader>
                    <DialogTitle>{t('support.createSupportTicket')}</DialogTitle>
                    <DialogDescription>
                      {t('support.createSupportTicketDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t('support.problemTitle')} *</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder={t('support.problemTitlePlaceholder')}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">{t('support.category')} *</Label>
                        <Select name="category" required>
                          <SelectTrigger id="category">
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="device">{t('support.device')}</SelectItem>
                            <SelectItem value="reports">{t('nav.reports')}</SelectItem>
                            <SelectItem value="consumption">{t('reports.consumption')}</SelectItem>
                            <SelectItem value="detection">{t('support.leakDetection')}</SelectItem>
                            <SelectItem value="account">{t('support.account')}</SelectItem>
                            <SelectItem value="billing">{t('support.billing')}</SelectItem>
                            <SelectItem value="question">{t('support.generalQuestion')}</SelectItem>
                            <SelectItem value="other">{t('common.other')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">{t('support.priority')} *</Label>
                        <Select name="priority" required>
                          <SelectTrigger id="priority">
                            <SelectValue placeholder={t('common.select')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">{t('support.high')}</SelectItem>
                            <SelectItem value="medium">{t('support.medium')}</SelectItem>
                            <SelectItem value="low">{t('support.low')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">{t('support.detailedDescription')} *</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder={t('support.descriptionPlaceholder')}
                        rows={6}
                        required
                      />
                    </div>

                    <Alert>
                      <AlertCircle className="size-4" />
                      <AlertDescription className="text-sm">
                        {t('support.responseTimeNotice')}
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit">
                      {t('support.createTicket')}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* RF35.3 - Tabs para filtrar por estado */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs [--mobile-tabs:2] sm:!grid sm:!w-full sm:grid-cols-4">
              <TabsTrigger value="all">
                {t('support.all', { count: tickets.length })}
              </TabsTrigger>
              <TabsTrigger value="open">
                {t('support.openPlural', { count: tickets.filter(t => t.status === 'open').length })}
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                {t('support.inProgressPlural', { count: tickets.filter(t => t.status === 'in_progress').length })}
              </TabsTrigger>
              <TabsTrigger value="closed">
                {t('support.closedPlural', { count: tickets.filter(t => t.status === 'closed').length })}
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {filteredTickets.map((ticket) => {
                const statusInfo = getStatusInfo(ticket.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={ticket.id}>
                    <CardHeader className="pb-3">
                      <div className="flex min-w-0 items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div className="shrink-0 bg-blue-50 p-2 rounded-lg mt-1">
                            <Headphones className="size-5 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-2">
                              <CardTitle className="text-base">{ticket.title}</CardTitle>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600 sm:text-sm">
                              <Badge variant="secondary" className="text-xs">
                                {ticket.id}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {t(`support.${ticket.priority}`)}
                              </Badge>
                              <Badge className={statusInfo.color}>
                                <StatusIcon className="size-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                              <span>•</span>
                              <span>{t(`support.categories.${ticket.category}`)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-700">{ticket.description}</p>
                      
                      {ticket.responses.length > 0 && (
                        <div className="space-y-2 pt-3 border-t">
                          <p className="text-sm font-medium">{t('support.responses', { count: ticket.responses.length })}</p>
                          {ticket.responses.map((response, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
                                <span className="text-sm font-medium">{response.from}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(response.timestamp).toLocaleString('es-CO')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-1 pt-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                        <span>{t('support.created')}: {new Date(ticket.createdAt).toLocaleString()}</span>
                        {ticket.assignedTo && (
                          <span>{t('support.assignedTo')}: {ticket.assignedTo}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredTickets.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Headphones className="size-12 mx-auto mb-4 opacity-50" />
                  <p>{t('support.noTickets', { status: activeTab !== 'all' ? getStatusInfo(activeTab).label.toLowerCase() : '' })}</p>
                </div>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

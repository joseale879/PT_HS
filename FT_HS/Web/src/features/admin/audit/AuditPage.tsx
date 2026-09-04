import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Badge } from '@shared/ui/badge';
import { Calendar } from '@shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/ui/table';
import { 
  Shield, 
  Search, 
  Calendar as CalendarIcon, 
  Download, 
  Filter,
  UserPlus,
  LogIn,
  LogOut,
  Settings,
  Trash2,
  Edit,
  Key,
  Home,
  Droplets,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// RF34 - Auditoría
export function AuditLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // RF34.1 - Eventos importantes registrados
  const auditEvents = [
    {
      id: 1,
      type: 'LOGIN',
      action: 'Inicio de sesión exitoso',
      user: 'admin@aquamonitor.com',
      userName: 'Administrador Sistema',
      timestamp: new Date('2025-10-28T10:30:00'),
      ip: '192.168.1.100',
      status: 'success',
      details: 'Login desde navegador Chrome'
    },
    {
      id: 3,
      type: 'PASSWORD_CHANGE',
      action: 'Cambio de contraseña',
      user: 'tecnico@aquamonitor.com',
      userName: 'Técnico IoT',
      timestamp: new Date('2025-10-27T16:45:00'),
      ip: '192.168.1.102',
      status: 'success',
      details: 'Contraseña actualizada correctamente'
    },
    {
      id: 4,
      type: 'DEVICE_ADDED',
      action: 'Dispositivo IoT agregado',
      user: 'usuario@ejemplo.com',
      userName: 'Juan Pérez',
      timestamp: new Date('2025-10-27T14:20:00'),
      ip: '192.168.1.101',
      status: 'success',
      details: 'Dispositivo: Sensor Cocina - ID: IOT-001'
    },
    {
      id: 5,
      type: 'HOME_CREATED',
      action: 'Nuevo hogar registrado',
      user: 'usuario@ejemplo.com',
      userName: 'Juan Pérez',
      timestamp: new Date('2025-10-27T12:00:00'),
      ip: '192.168.1.101',
      status: 'success',
      details: 'Casa Principal - Calle 123 #45-67'
    },
    {
      id: 6,
      type: 'LOGIN_FAILED',
      action: 'Intento de inicio de sesión fallido',
      user: 'desconocido@ejemplo.com',
      userName: 'Usuario Desconocido',
      timestamp: new Date('2025-10-27T08:30:00'),
      ip: '192.168.1.200',
      status: 'error',
      details: 'Credenciales incorrectas - Intento 3/5'
    },
    {
      id: 7,
      type: 'ACCOUNT_LOCKED',
      action: 'Cuenta bloqueada temporalmente',
      user: 'usuario@ejemplo.com',
      userName: 'Juan Pérez',
      timestamp: new Date('2025-10-26T18:00:00'),
      ip: '192.168.1.101',
      status: 'warning',
      details: 'Bloqueado por 15 minutos - 5 intentos fallidos'
    },
    {
      id: 8,
      type: 'SETTINGS_CHANGED',
      action: 'Configuración de notificaciones actualizada',
      user: 'usuario@ejemplo.com',
      userName: 'Juan Pérez',
      timestamp: new Date('2025-10-26T15:30:00'),
      ip: '192.168.1.101',
      status: 'success',
      details: 'Notificaciones de email habilitadas'
    },
    {
      id: 9,
      type: 'LEAK_DETECTED',
      action: 'Fuga detectada',
      user: 'system',
      userName: 'Sistema Automático',
      timestamp: new Date('2025-10-26T03:15:00'),
      ip: 'SYSTEM',
      status: 'warning',
      details: 'Dispositivo: Baño Principal - Flujo constante por 2 horas'
    },
    {
      id: 10,
      type: 'USER_DELETED',
      action: 'Cuenta de usuario eliminada',
      user: 'admin@aquamonitor.com',
      userName: 'Administrador Sistema',
      timestamp: new Date('2025-10-25T11:00:00'),
      ip: '192.168.1.100',
      status: 'success',
      details: 'Usuario: test@ejemplo.com eliminado permanentemente'
    },
    {
      id: 11,
      type: 'VACATION_MODE_ACTIVATED',
      action: 'Modo vacaciones activado',
      user: 'usuario@ejemplo.com',
      userName: 'Juan Pérez',
      timestamp: new Date('2025-10-25T09:00:00'),
      ip: '192.168.1.101',
      status: 'success',
      details: 'Periodo: 25/10/2025 - 10/11/2025'
    },
    {
      id: 12,
      type: 'DEVICE_CALIBRATED',
      action: 'Sensor calibrado',
      user: 'tecnico@aquamonitor.com',
      userName: 'Técnico IoT',
      timestamp: new Date('2025-10-24T14:30:00'),
      ip: '192.168.1.102',
      status: 'success',
      details: 'Dispositivo: IOT-001 - Factor K ajustado'
    },
  ];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'LOGIN':
        return <LogIn className="size-4 text-blue-600" />;
      case 'LOGOUT':
        return <LogOut className="size-4 text-gray-600" />;
      case 'PASSWORD_CHANGE':
        return <Key className="size-4 text-orange-600" />;
      case 'USER_CREATED':
      case 'USER_DELETED':
        return <UserPlus className="size-4 text-green-600" />;
      case 'DEVICE_ADDED':
      case 'DEVICE_CALIBRATED':
        return <Droplets className="size-4 text-cyan-600" />;
      case 'HOME_CREATED':
        return <Home className="size-4 text-indigo-600" />;
      case 'SETTINGS_CHANGED':
        return <Settings className="size-4 text-gray-600" />;
      case 'LOGIN_FAILED':
      case 'ACCOUNT_LOCKED':
        return <AlertTriangle className="size-4 text-red-600" />;
      case 'LEAK_DETECTED':
        return <AlertTriangle className="size-4 text-amber-600" />;
      case 'VACATION_MODE_ACTIVATED':
        return <CheckCircle2 className="size-4 text-blue-600" />;
      default:
        return <Shield className="size-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Exitoso</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Advertencia</Badge>;
      default:
        return <Badge variant="secondary">Información</Badge>;
    }
  };

  // RF34.2 - Filtrar eventos
  const filteredEvents = auditEvents.filter((event) => {
    const matchesSearch = 
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || event.type === filterType;
    const matchesUser = filterUser === 'all' || event.user === filterUser;

    const matchesDateRange = 
      (!startDate || event.timestamp >= startDate) &&
      (!endDate || event.timestamp <= endDate);

    return matchesSearch && matchesType && matchesUser && matchesDateRange;
  });

  const exportAuditLog = () => {
    const csv = [
      ['Fecha/Hora', 'Usuario', 'Acción', 'Estado', 'IP', 'Detalles'],
      ...filteredEvents.map(event => [
        format(event.timestamp, 'dd/MM/yyyy HH:mm:ss', { locale: es }),
        event.userName,
        event.action,
        event.status,
        event.ip,
        event.details
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Shield className="size-6 text-purple-600" />
            </div>
            <div>
              <CardTitle>Registro de Auditoría</CardTitle>
              <CardDescription>
                Historial completo de eventos y acciones del sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filterType">Tipo de Evento</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filterType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="LOGIN">Inicio de sesión</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE">Cambio de contraseña</SelectItem>
                  <SelectItem value="DEVICE_ADDED">Dispositivos</SelectItem>
                  <SelectItem value="HOME_CREATED">Hogares</SelectItem>
                  <SelectItem value="LEAK_DETECTED">Fugas</SelectItem>
                  <SelectItem value="SETTINGS_CHANGED">Configuración</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="size-4 mr-2" />
                    {startDate ? format(startDate, 'PP', { locale: es }) : 'Desde...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Fecha Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="size-4 mr-2" />
                    {endDate ? format(endDate, 'PP', { locale: es }) : 'Hasta...'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {filteredEvents.length} de {auditEvents.length} eventos
            </div>
            <Button onClick={exportAuditLog} variant="outline">
              <Download className="size-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Tabla de eventos */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getEventIcon(event.type)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{format(event.timestamp, 'dd/MM/yyyy', { locale: es })}</div>
                      <div className="text-xs text-gray-500">
                        {format(event.timestamp, 'HH:mm:ss', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{event.userName}</div>
                      <div className="text-xs text-gray-500">{event.user}</div>
                    </TableCell>
                    <TableCell className="text-sm">{event.action}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs">
                      {event.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Shield className="size-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron eventos con los filtros aplicados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

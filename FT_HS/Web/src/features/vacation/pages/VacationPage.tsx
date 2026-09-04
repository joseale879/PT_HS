import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Label } from '@shared/ui/label';
import { Switch } from '@shared/ui/switch';
import { Calendar } from '@shared/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
import { Plane, Calendar as CalendarIcon, Bell, BellOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// RF29 - Modo Vacaciones / Ausencias
export function VacationMode() {
  const [isVacationModeActive, setIsVacationModeActive] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showHistory, setShowHistory] = useState(false);

  // Historial simulado de activaciones
  const vacationHistory = [
    {
      id: 1,
      startDate: '2024-12-15',
      endDate: '2024-12-28',
      status: 'completed',
      activatedBy: 'Juan Pérez',
      abnormalConsumption: false
    },
    {
      id: 2,
      startDate: '2024-08-01',
      endDate: '2024-08-15',
      status: 'completed',
      activatedBy: 'Juan Pérez',
      abnormalConsumption: true,
      alert: 'Consumo anormal detectado el 08/08/2024'
    }
  ];

  // RF29.1 - Activar modo vacaciones
  const handleActivateVacationMode = () => {
    if (!startDate || !endDate) {
      toast.error('Por favor selecciona las fechas de inicio y fin');
      return;
    }

    if (startDate >= endDate) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    setIsVacationModeActive(true);

    // RF29.5 - Registrar en historial de auditoría
    console.log('Modo Vacaciones Activado - Auditoría:', {
      action: 'VACATION_MODE_ACTIVATED',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      user: 'Juan Pérez',
      timestamp: new Date().toISOString()
    });

    // RF29.7 - Enviar notificación
    toast.success('Modo vacaciones activado', {
      description: `Desde ${format(startDate, 'PP', { locale: es })} hasta ${format(endDate, 'PP', { locale: es })}`
    });
  };

  // RF29.4 - Finalizar modo vacaciones
  const handleDeactivateVacationMode = () => {
    setIsVacationModeActive(false);
    setStartDate(undefined);
    setEndDate(undefined);

    // RF29.5 - Registrar en auditoría
    console.log('Modo Vacaciones Finalizado - Auditoría:', {
      action: 'VACATION_MODE_DEACTIVATED',
      user: 'Juan Pérez',
      timestamp: new Date().toISOString()
    });

    // RF29.7 - Notificar retorno al modo normal
    toast.success('Modo vacaciones desactivado', {
      description: 'Has vuelto al modo normal de monitoreo'
    });
  };

  return (
    <div className="space-y-6">
      {/* RF29.2 - Estado actual del modo vacaciones */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className={`shrink-0 p-2 rounded-lg sm:p-3 ${isVacationModeActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Plane className={`size-6 ${isVacationModeActive ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <div className="min-w-0">
                <CardTitle>Modo Vacaciones</CardTitle>
                <CardDescription>
                  Suspende notificaciones normales durante tu ausencia
                </CardDescription>
              </div>
            </div>
            <Badge variant={isVacationModeActive ? 'default' : 'secondary'} className={`w-fit ${isVacationModeActive ? 'bg-blue-600' : ''}`}>
              {isVacationModeActive ? (
                <><CheckCircle2 className="size-3 mr-1" /> Activo</>
              ) : (
                <><BellOff className="size-3 mr-1" /> Inactivo</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* RF29.3 - Información sobre notificaciones durante modo vacaciones */}
          <Alert>
            <Bell className="size-4" />
            <AlertDescription>
              Durante el modo vacaciones, solo recibirás alertas críticas:
              <ul className="ml-4 list-disc mt-2 space-y-1 text-sm">
                <li>Detección de fugas o consumo anormal</li>
                <li>Desconexión de dispositivos IoT</li>
                <li>Alertas de seguridad del sistema</li>
              </ul>
              Las notificaciones de consumo normal estarán suspendidas.
            </AlertDescription>
          </Alert>

          {isVacationModeActive ? (
            // Modo activo - mostrar detalles
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-blue-900">
                  <Plane className="size-5" />
                  <span className="font-semibold">Modo Vacaciones Activo</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Fecha de inicio:</p>
                    <p className="font-medium text-blue-900">
                      {startDate && format(startDate, 'PP', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Fecha de fin:</p>
                    <p className="font-medium text-blue-900">
                      {endDate && format(endDate, 'PP', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-300">
                  <p className="text-sm text-blue-700">
                    Duración: {startDate && endDate && Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} días
                  </p>
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertDescription>
                  El modo vacaciones se desactivará automáticamente el{' '}
                  {endDate && format(endDate, 'PP', { locale: es })}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex-1"
                >
                  Ver Historial
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeactivateVacationMode}
                  className="flex-1"
                >
                  Desactivar Modo Vacaciones
                </Button>
              </div>
            </div>
          ) : (
            // Modo inactivo - configurar fechas
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Inicio</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="size-4" />
                        {startDate ? format(startDate, 'PP', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de Fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="size-4" />
                        {endDate ? format(endDate, 'PP', { locale: es }) : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => !startDate || date <= startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* RF29.6 - Solo administrador del hogar puede activar */}
              <Alert>
                <AlertTriangle className="size-4" />
                <AlertDescription className="text-sm">
                  Solo el administrador del hogar puede activar o modificar el modo vacaciones
                  en hogares compartidos.
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleActivateVacationMode} 
                className="w-full"
                disabled={!startDate || !endDate}
              >
                <Plane className="size-4" />
                Activar Modo Vacaciones
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial de activaciones */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de Modo Vacaciones</CardTitle>
            <CardDescription>Activaciones anteriores del modo vacaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vacationHistory.map((entry) => (
                <div 
                  key={entry.id}
                  className={`p-4 rounded-lg border ${
                    entry.abnormalConsumption 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Plane className={`size-4 ${entry.abnormalConsumption ? 'text-amber-600' : 'text-gray-600'}`} />
                      <span className="font-medium">
                        {format(new Date(entry.startDate), 'PP', { locale: es })} - {format(new Date(entry.endDate), 'PP', { locale: es })}
                      </span>
                    </div>
                    <Badge variant="secondary" className={entry.status === 'completed' ? 'bg-green-100 text-green-800' : ''}>
                      {entry.status === 'completed' ? 'Completado' : 'En progreso'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">Activado por: {entry.activatedBy}</p>
                  {entry.abnormalConsumption && entry.alert && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="size-4" />
                      <AlertDescription className="text-sm">
                        {entry.alert}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

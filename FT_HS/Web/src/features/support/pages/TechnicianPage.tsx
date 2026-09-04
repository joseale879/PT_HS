import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { 
  Wrench, 
  Droplets, 
  Battery, 
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Activity,
  Signal
} from 'lucide-react';
import { Progress } from '@shared/ui/progress';

export function TechnicianPanel() {
  // RF22.2 - Panel específico para técnicos
  const devicesRequiringAttention = [
    { id: 1, name: 'Sensor Jardín - Casa 123', issue: 'Batería crítica (8%)', priority: 'high', location: 'Calle 45 #12-34' },
    { id: 2, name: 'Sensor Cocina - Apto 501', issue: 'Desconectado desde hace 48h', priority: 'high', location: 'Carrera 7 #85-12' },
    { id: 3, name: 'Sensor Baño - Casa 456', issue: 'Señal débil (35%)', priority: 'medium', location: 'Transversal 23 #45-67' },
    { id: 4, name: 'Sensor Principal - Edificio B', issue: 'Requiere calibración', priority: 'medium', location: 'Avenida 68 #12-90' },
    { id: 5, name: 'Sensor Lavandería - Casa 789', issue: 'Batería media (22%)', priority: 'low', location: 'Calle 100 #15-45' },
  ];

  const maintenanceStats = {
    pendingTasks: 12,
    completedToday: 8,
    devicesOnline: 342,
    devicesOffline: 15,
    averageResponseTime: '2.3h'
  };

  const calibrationHistory = [
    { device: 'Sensor Baño - Casa Principal', date: '2025-10-23', technician: 'Técnico IoT', factorK: 450, status: 'success' },
    { device: 'Sensor Cocina - Apto 301', date: '2025-10-22', technician: 'Técnico IoT', factorK: 445, status: 'success' },
    { device: 'Sensor Jardín - Casa 567', date: '2025-10-21', technician: 'Técnico IoT', factorK: 455, status: 'success' },
  ];

  return (
    <div className="space-y-6">
      {/* Resumen de tareas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tareas Pendientes</CardDescription>
            <CardTitle className="text-3xl text-orange-600">
              {maintenanceStats.pendingTasks}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              5 de alta prioridad
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completadas Hoy</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {maintenanceStats.completedToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              67% del objetivo
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Dispositivos Online</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Wifi className="size-6 text-green-600" />
              {maintenanceStats.devicesOnline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              95.8% del total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Dispositivos Offline</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <WifiOff className="size-6 text-red-600" />
              {maintenanceStats.devicesOffline}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Requieren revisión
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tiempo Respuesta</CardDescription>
            <CardTitle className="text-3xl">
              {maintenanceStats.averageResponseTime}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">
              -15% vs mes anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dispositivos que requieren atención */}
      <Card>
        <CardHeader>
          <CardTitle>Dispositivos que Requieren Atención</CardTitle>
          <CardDescription>Lista priorizada de mantenimiento y reparaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {devicesRequiringAttention.map((device) => (
              <div
                key={device.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  device.priority === 'high' ? 'bg-red-50 border-red-200' :
                  device.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    device.priority === 'high' ? 'bg-red-100' :
                    device.priority === 'medium' ? 'bg-orange-100' :
                    'bg-yellow-100'
                  }`}>
                    <Droplets className={`size-5 ${
                      device.priority === 'high' ? 'text-red-600' :
                      device.priority === 'medium' ? 'text-orange-600' :
                      'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm">{device.name}</div>
                    <div className="text-xs text-gray-600">{device.location}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="size-3 text-gray-600" />
                      <span className="text-xs text-gray-700">{device.issue}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={
                    device.priority === 'high' ? 'destructive' :
                    device.priority === 'medium' ? 'default' :
                    'outline'
                  }>
                    {device.priority === 'high' ? 'Alta' :
                     device.priority === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Atender
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Panel de calibración rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Herramientas de Calibración</CardTitle>
          <CardDescription>Ajustes técnicos para sensores IoT</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="calibrate">
            <TabsList>
              <TabsTrigger value="calibrate">Calibrar Dispositivo</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
              <TabsTrigger value="diagnostics">Diagnósticos</TabsTrigger>
            </TabsList>

            <TabsContent value="calibrate" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">ID del Dispositivo</Label>
                <Input id="deviceId" placeholder="AQUA-2024-XXXX" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="factorK">Factor K (pulsos/litro)</Label>
                  <Input id="factorK" type="number" defaultValue="450" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="offset">Offset (m³)</Label>
                  <Input id="offset" type="number" defaultValue="0" step="0.001" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas de calibración</Label>
                <Input id="notes" placeholder="Ej: Ajuste por descalibración detectada en flujo alto" />
              </div>

              <div className="flex gap-3">
                <Button>
                  <Settings className="size-4 mr-2" />
                  Aplicar Calibración
                </Button>
                <Button variant="outline">
                  <Activity className="size-4 mr-2" />
                  Ejecutar Prueba
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                {calibrationHistory.map((record, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="size-5 text-green-600" />
                      <div>
                        <div className="text-sm">{record.device}</div>
                        <div className="text-xs text-gray-600">
                          Factor K: {record.factorK} • {record.date} • {record.technician}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Exitosa
                    </Badge>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="diagnostics" className="mt-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Conectividad de Red</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Signal className="size-3 mr-1" />
                      Excelente
                    </Badge>
                  </div>
                  <Progress value={95} className="h-2" />
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Precisión de Medición</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      ±2.5%
                    </Badge>
                  </div>
                  <Progress value={97} className="h-2" />
                </div>

                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado de Batería</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      <Battery className="size-3 mr-1" />
                      Media (45%)
                    </Badge>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

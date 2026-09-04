import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { 
  Users, 
  Droplets, 
  Building2, 
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  UserPlus,
  Settings
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function AdminPanel() {
  // RF22.2 - Estadísticas generales del sistema para administradores
  const systemStats = {
    totalUsers: 1247,
    activeDevices: 3521,
    totalHomes: 892,
    monthlyConsumption: 45682.3,
    alertsToday: 23
  };

  const userGrowth = [
    { month: 'Ene', users: 850 },
    { month: 'Feb', users: 920 },
    { month: 'Mar', users: 1015 },
    { month: 'Abr', users: 1098 },
    { month: 'May', users: 1156 },
    { month: 'Jun', users: 1247 },
  ];

  const devicesByType = [
    { type: 'Básico', count: 1520 },
    { type: 'Avanzado', count: 1245 },
    { type: 'Premium', count: 756 },
  ];

  const recentUsers = [
    { name: 'María González', email: 'maria.g@email.com', date: '2025-10-23', status: 'active' },
    { name: 'Carlos Ramírez', email: 'carlos.r@email.com', date: '2025-10-22', status: 'pending' },
    { name: 'Ana Torres', email: 'ana.t@email.com', date: '2025-10-22', status: 'active' },
    { name: 'Luis Martínez', email: 'luis.m@email.com', date: '2025-10-21', status: 'active' },
  ];

  const systemAlerts = [
    { id: 1, type: 'warning', message: '15 dispositivos con batería baja', count: 15 },
    { id: 2, type: 'error', message: '8 dispositivos offline por más de 24h', count: 8 },
    { id: 3, type: 'info', message: '45 usuarios cerca del límite de consumo', count: 45 },
  ];

  return (
    <div className="space-y-6">
      {/* Resumen ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Usuarios Totales</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="size-6 text-blue-600" />
              {systemStats.totalUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <TrendingUp className="size-4" />
              <span>+7.8% este mes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Dispositivos Activos</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Droplets className="size-6 text-cyan-600" />
              {systemStats.activeDevices}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              98.2% operativos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Hogares</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Building2 className="size-6 text-purple-600" />
              {systemStats.totalHomes}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              Promedio: 3.9 dispositivos/hogar
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Consumo Mensual</CardDescription>
            <CardTitle className="text-3xl">
              {(systemStats.monthlyConsumption / 1000).toFixed(1)}k
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              m³ en total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Alertas Hoy</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <AlertTriangle className="size-6 text-orange-600" />
              {systemStats.alertsToday}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              5 críticas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas del sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas del Sistema</CardTitle>
          <CardDescription>Notificaciones que requieren atención administrativa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.type === 'error' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`size-5 ${
                    alert.type === 'error' ? 'text-red-600' :
                    alert.type === 'warning' ? 'text-orange-600' :
                    'text-blue-600'
                  }`} />
                  <span className="text-sm">{alert.message}</span>
                </div>
                <Button variant="outline" size="sm">
                  Revisar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de administración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de Usuarios</CardTitle>
            <CardDescription>Usuarios registrados por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos por Tipo</CardTitle>
            <CardDescription>Distribución de dispositivos en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={devicesByType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios recientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuarios Recientes</CardTitle>
              <CardDescription>Últimos usuarios registrados en el sistema</CardDescription>
            </div>
            <Button>
              <UserPlus className="size-4 mr-2" />
              Crear Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentUsers.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="size-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm">{user.name}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-600">{user.date}</div>
                  <Badge variant={user.status === 'active' ? 'default' : 'outline'}>
                    {user.status === 'active' ? (
                      <><CheckCircle2 className="size-3 mr-1" /> Activo</>
                    ) : (
                      'Pendiente'
                    )}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@shared/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@shared/ui/alert-dialog';
import { Badge } from '@shared/ui/badge';
import { Switch } from '@shared/ui/switch';
import { Building2, Plus, MapPin, Users, Droplets, Edit, Trash2, Pause, Play, Plane, AlertCircle, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { MembershipRequestsPanel } from '../ui/MembershipRequestsPanel';

interface User {
  id: number;
  name: string;
  email: string;
  initials: string;
  color: string;
}

interface HomeMember {
  id: number;
  homeId: number;
  userId: number;
  role: 'admin' | 'member';
}

export function HomeManagement() {
  const { t } = useTranslation();

  // Usuario actual (simulando sesión - en producción vendría del contexto de autenticación)
  const CURRENT_USER_ID = 1; // Juan Pérez es el usuario actual

  const [homes, setHomes] = useState([
    {
      id: 1,
      name: 'Casa Principal',
      address: 'Calle 123 #45-67',
      city: 'Bogotá',
      type: 'Familiar',
      stratum: '3',
      devices: 3,
      members: 4,
      consumption: 52.3,
      status: 'active', // active, suspended, vacation
      vacationMode: false
    },
    {
      id: 2,
      name: 'Apartamento Centro',
      address: 'Carrera 10 #20-30',
      city: 'Medellín',
      type: 'Familiar',
      stratum: '4',
      devices: 2,
      members: 2,
      consumption: 28.5,
      status: 'active',
      vacationMode: false
    },
    {
      id: 3,
      name: 'Apartamento Arrendado Norte',
      address: 'Calle 100 #15-20',
      city: 'Bogotá',
      type: 'Familiar',
      stratum: '5',
      devices: 1,
      members: 3,
      consumption: 18.2,
      status: 'active',
      vacationMode: false
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan.perez@ejemplo.com',
      initials: 'JP',
      color: 'bg-blue-600'
    },
    {
      id: 2,
      name: 'María García',
      email: 'maria.garcia@ejemplo.com',
      initials: 'MG',
      color: 'bg-purple-600'
    },
    {
      id: 3,
      name: 'Carlos López',
      email: 'carlos.lopez@ejemplo.com',
      initials: 'CL',
      color: 'bg-green-600'
    }
  ]);

  const [homeMembers, setHomeMembers] = useState<HomeMember[]>([
    // Juan (id:1) es admin de Casa Principal (herencia de su mamá)
    { id: 1, homeId: 1, userId: 1, role: 'admin' },
    { id: 2, homeId: 1, userId: 2, role: 'member' },

    // Juan (id:1) es admin de Apartamento Centro (casa que compró)
    { id: 3, homeId: 2, userId: 1, role: 'admin' },
    { id: 4, homeId: 2, userId: 3, role: 'member' },

    // Juan (id:1) es MIEMBRO del Apartamento Norte (donde arrienda y vive)
    { id: 5, homeId: 3, userId: 2, role: 'admin' }, // María es la dueña
    { id: 6, homeId: 3, userId: 1, role: 'member' }  // Juan arrienda aquí
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isAddToHomeDialogOpen, setIsAddToHomeDialogOpen] = useState(false);
  const [editingHomeId, setEditingHomeId] = useState<number | null>(null);
  const [detailsHomeId, setDetailsHomeId] = useState<number | null>(null);
  const [selectedHomeForMembers, setSelectedHomeForMembers] = useState(homes[0]?.id || 1);
  const [selectedUserForHome, setSelectedUserForHome] = useState<number | null>(null);

  // Verificar si el usuario actual es admin de un hogar específico
  const isCurrentUserAdmin = (homeId: number): boolean => {
    return homeMembers.some(
      m => m.homeId === homeId && m.userId === CURRENT_USER_ID && m.role === 'admin'
    );
  };

  // Obtener el rol del usuario actual en un hogar
  const getCurrentUserRole = (homeId: number): 'admin' | 'member' | null => {
    const membership = homeMembers.find(
      m => m.homeId === homeId && m.userId === CURRENT_USER_ID
    );
    return membership ? membership.role : null;
  };

  // Función auxiliar para generar iniciales
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Función auxiliar para generar color aleatorio
  const getRandomColor = () => {
    const colors = [
      'bg-blue-600',
      'bg-purple-600',
      'bg-green-600',
      'bg-red-600',
      'bg-yellow-600',
      'bg-pink-600',
      'bg-indigo-600',
      'bg-teal-600'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // RF8 - Registrar nuevo hogar
  const handleRegisterHome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newHome = {
      id: homes.length > 0 ? Math.max(...homes.map(h => h.id)) + 1 : 1,
      name: formData.get('homeName') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      type: formData.get('homeType') as string || 'Familiar',
      stratum: formData.get('stratum') as string,
      devices: 0,
      members: 1,
      consumption: 0,
      status: 'active' as const,
      vacationMode: false
    };

    setHomes([...homes, newHome]);

    // Agregar automáticamente al usuario actual como administrador del nuevo hogar
    const newMembership: HomeMember = {
      id: homeMembers.length > 0 ? Math.max(...homeMembers.map(m => m.id)) + 1 : 1,
      homeId: newHome.id,
      userId: CURRENT_USER_ID,
      role: 'admin'
    };

    setHomeMembers([...homeMembers, newMembership]);

    toast.success(t('homes.register'), {
      description: `${newHome.name} ha sido registrado y eres el administrador`
    });

    setIsAddDialogOpen(false);
    e.currentTarget.reset();
  };

  // RF9 - Edición de hogares
  const handleEditHome = (e: React.FormEvent<HTMLFormElement>, homeId: number) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setHomes(homes.map(home =>
      home.id === homeId ? {
        ...home,
        name: formData.get('homeName') as string,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        type: formData.get('homeType') as string,
        stratum: formData.get('stratum') as string,
      } : home
    ));

    toast.success('Cambios guardados', {
      description: 'La informacion del hogar ha sido actualizada'
    });

    setEditingHomeId(null);
  };

  // RF10 - Suspender/Reactivar hogar
  const handleSuspendHome = (homeId: number) => {
    setHomes(homes.map(home => 
      home.id === homeId ? { ...home, status: 'suspended' } : home
    ));
    toast.success('Hogar suspendido', {
      description: 'El hogar ha sido suspendido temporalmente'
    });
  };

  const handleReactivateHome = (homeId: number) => {
    setHomes(homes.map(home => 
      home.id === homeId ? { ...home, status: 'active', vacationMode: false } : home
    ));
    toast.success('Hogar reactivado', {
      description: 'El hogar ha sido reactivado exitosamente'
    });
  };

  // RF7 - Agregar miembro al hogar (crear nuevo usuario)
  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const homeId = Number(formData.get('homeId'));
    const memberName = formData.get('memberName') as string;
    const memberEmail = formData.get('memberEmail') as string;
    const memberRole = formData.get('memberRole') as 'admin' | 'member';

    // Verificar si el usuario ya existe
    const existingUser = users.find(u => u.email.toLowerCase() === memberEmail.toLowerCase());

    if (existingUser) {
      // Verificar si ya es miembro de este hogar
      const alreadyMember = homeMembers.some(
        m => m.userId === existingUser.id && m.homeId === homeId
      );

      if (alreadyMember) {
        toast.error('Usuario ya es miembro', {
          description: `${existingUser.name} ya pertenece a este hogar`
        });
        return;
      }

      // Agregar al hogar existente
      const newMembership: HomeMember = {
        id: homeMembers.length > 0 ? Math.max(...homeMembers.map(m => m.id)) + 1 : 1,
        homeId: homeId,
        userId: existingUser.id,
        role: memberRole
      };

      setHomeMembers([...homeMembers, newMembership]);

      const homeName = homes.find(h => h.id === homeId)?.name;
      toast.success(t('homes.addMemberButton'), {
        description: `${existingUser.name} ha sido agregado a ${homeName}`
      });
    } else {
      // Crear nuevo usuario
      const newUser: User = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name: memberName,
        email: memberEmail,
        initials: getInitials(memberName),
        color: getRandomColor()
      };

      setUsers([...users, newUser]);

      // Crear membresía
      const newMembership: HomeMember = {
        id: homeMembers.length > 0 ? Math.max(...homeMembers.map(m => m.id)) + 1 : 1,
        homeId: homeId,
        userId: newUser.id,
        role: memberRole
      };

      setHomeMembers([...homeMembers, newMembership]);

      const homeName = homes.find(h => h.id === homeId)?.name;
      toast.success(t('homes.addMemberButton'), {
        description: `${memberName} ha sido creado y agregado a ${homeName}`
      });
    }

    setIsAddMemberDialogOpen(false);
    e.currentTarget.reset();
  };

  // Agregar usuario existente a múltiples hogares
  const handleAddUserToHome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const userId = Number(formData.get('userId'));
    const homeIds = formData.getAll('homeIds').map(id => Number(id));
    const memberRole = formData.get('memberRole') as 'admin' | 'member';

    const user = users.find(u => u.id === userId);
    if (!user) return;

    let addedCount = 0;
    const newMemberships: HomeMember[] = [];

    homeIds.forEach(homeId => {
      // Verificar si ya es miembro
      const alreadyMember = homeMembers.some(
        m => m.userId === userId && m.homeId === homeId
      );

      if (!alreadyMember) {
        const newMembership: HomeMember = {
          id: homeMembers.length + newMemberships.length + 1,
          homeId: homeId,
          userId: userId,
          role: memberRole
        };
        newMemberships.push(newMembership);
        addedCount++;
      }
    });

    if (newMemberships.length > 0) {
      setHomeMembers([...homeMembers, ...newMemberships]);

      toast.success('Usuario agregado', {
        description: `${user.name} ha sido agregado a ${addedCount} hogar(es)`
      });
    } else {
      toast.info('Sin cambios', {
        description: 'El usuario ya pertenece a los hogares seleccionados'
      });
    }

    setIsAddToHomeDialogOpen(false);
    setSelectedUserForHome(null);
  };

  // RF10 - Eliminar hogar
  const handleDeleteHome = (homeId: number) => {
    const home = homes.find(h => h.id === homeId);

    // Eliminar el hogar
    setHomes(homes.filter(h => h.id !== homeId));

    // Eliminar todos los miembros asociados a ese hogar
    setHomeMembers(homeMembers.filter(m => m.homeId !== homeId));

    // Si el hogar eliminado era el seleccionado, cambiar al primero disponible
    if (selectedHomeForMembers === homeId) {
      const remainingHomes = homes.filter(h => h.id !== homeId);
      if (remainingHomes.length > 0) {
        setSelectedHomeForMembers(remainingHomes[0].id);
      }
    }

    toast.success(t('homes.homeDeleted'), {
      description: t('homes.homeDeletedDesc')
    });
  };

  // RF7 - Eliminar miembro del hogar
  const handleDeleteMember = (membershipId: number) => {
    const membership = homeMembers.find(m => m.id === membershipId);
    if (!membership) return;

    const user = users.find(u => u.id === membership.userId);

    // Eliminar la membresía
    setHomeMembers(homeMembers.filter(m => m.id !== membershipId));

    toast.success(t('homes.memberDeleted'), {
      description: user ? `${user.name} ha sido removido del hogar` : t('homes.memberDeletedDesc')
    });
  };

  // Obtener hogares de un usuario
  const getUserHomes = (userId: number) => {
    const userMemberships = homeMembers.filter(m => m.userId === userId);
    return userMemberships.map(m => {
      const home = homes.find(h => h.id === m.homeId);
      return { ...m, homeName: home?.name || 'Desconocido' };
    });
  };

  // RF10.4 - Modo vacaciones
  const handleVacationMode = (homeId: number, enabled: boolean) => {
    setHomes(homes.map(home =>
      home.id === homeId ? {
        ...home,
        vacationMode: enabled,
        status: enabled ? 'vacation' : 'active'
      } : home
    ));

    if (enabled) {
      toast.success('Modo vacaciones activado', {
        description: 'Las alertas y notificaciones han sido pausadas'
      });
    } else {
      toast.success('Modo vacaciones desactivado', {
        description: 'Las alertas y notificaciones se han reactivado'
      });
    }
  };

  // Obtener resumen del usuario actual
  const currentUserAdminHomes = homes.filter(h => isCurrentUserAdmin(h.id));
  const currentUserMemberHomes = homes.filter(h => getCurrentUserRole(h.id) === 'member');

  return (
    <div className="space-y-6">
      {/* RF8 - Header con acción para agregar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl text-gray-900">{t('homes.title')}</h2>
          <p className="text-gray-600">{t('homes.subtitle')}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3 mt-2">
            <Badge className="bg-green-600">
              {t('homes.asAdministrator', { count: currentUserAdminHomes.length })}
            </Badge>
            <Badge variant="secondary">
              {t('homes.asMember', { count: currentUserMemberHomes.length })}
            </Badge>
          </div>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="size-4" />
              {t('homes.registerNewHome')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleRegisterHome}>
              <DialogHeader>
                <DialogTitle>{t('homes.registerNewHome')}</DialogTitle>
                <DialogDescription>
                  {t('homes.subtitle')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="homeName">{t('homes.homeName')} *</Label>
                  <Input id="homeName" name="homeName" placeholder={t('homes.homeNamePlaceholder')} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('homes.address')} *</Label>
                  <Input id="address" name="address" placeholder={t('homes.addressPlaceholder')} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t('homes.city')} *</Label>
                    <Input id="city" name="city" placeholder={t('homes.cityPlaceholder')} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="homeType">{t('homes.type')} *</Label>
                    <Select name="homeType" required defaultValue="Familiar">
                      <SelectTrigger id="homeType">
                        <SelectValue placeholder={t('homes.select')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Familiar">{t('homes.familiar')}</SelectItem>
                        <SelectItem value="Comercial">{t('homes.commercial')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stratum">{t('homes.stratum')} *</Label>
                  <Select name="stratum" required>
                    <SelectTrigger id="stratum">
                      <SelectValue placeholder={t('homes.selectStratum')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('homes.stratum')} 1</SelectItem>
                      <SelectItem value="2">{t('homes.stratum')} 2</SelectItem>
                      <SelectItem value="3">{t('homes.stratum')} 3</SelectItem>
                      <SelectItem value="4">{t('homes.stratum')} 4</SelectItem>
                      <SelectItem value="5">{t('homes.stratum')} 5</SelectItem>
                      <SelectItem value="6">{t('homes.stratum')} 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  {t('homes.cancel')}
                </Button>
                <Button type="submit">
                  {t('homes.register')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* RF11 - Lista de hogares registrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {homes.map((home) => {
          const userRole = getCurrentUserRole(home.id);
          const isAdmin = isCurrentUserAdmin(home.id);

          return (
            <Card key={home.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-3 rounded-lg ${
                      home.status === 'active' ? 'bg-blue-100' :
                      home.status === 'vacation' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {home.vacationMode ? (
                        <Plane className="size-6 text-purple-600" />
                      ) : (
                        <Building2 className={`size-6 ${
                          home.status === 'active' ? 'text-blue-600' :
                          home.status === 'vacation' ? 'text-purple-600' :
                          'text-gray-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle>{home.name}</CardTitle>
                        {/* Badge de rol del usuario */}
                        {userRole === 'admin' ? (
                          <Badge className="bg-green-600">{t('homes.administrator')}</Badge>
                        ) : userRole === 'member' ? (
                          <Badge variant="secondary">{t('homes.member')}</Badge>
                        ) : null}
                        {home.status === 'suspended' && (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            {t('homes.suspended')}
                          </Badge>
                        )}
                        {home.vacationMode && (
                          <Badge variant="outline" className="text-purple-600 border-purple-600">
                            <Plane className="size-3 mr-1" />
                            {t('homes.vacation')}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="size-3" />
                        {home.address}, {home.city}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 mobile-inline-grid">
                <div>
                  <div className="text-sm text-gray-600">{t('homes.type')}</div>
                  <Badge variant="outline">{t(`homes.${home.type.toLowerCase()}`)}</Badge>
                </div>
                <div>
                  <div className="text-sm text-gray-600">{t('homes.stratum')}</div>
                  <Badge variant="outline">{home.stratum}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t mobile-inline-grid">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Droplets className="size-4" />
                    <span className="text-[11px] sm:text-xs">{t('homes.devices')}</span>
                  </div>
                  <div className="text-base sm:text-xl mt-1">{home.devices}</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-600">
                    <Users className="size-4" />
                    <span className="text-[11px] sm:text-xs">{t('homes.members')}</span>
                  </div>
                  <div className="text-base sm:text-xl mt-1">{home.members}</div>
                </div>
                <div className="text-center">
                  <div className="text-[11px] sm:text-xs text-gray-600">{t('homes.monthlyConsumption')}</div>
                  <div className="text-base sm:text-xl mt-1">{home.consumption} m³</div>
                </div>
              </div>

              {/* RF10.4 - Modo vacaciones - Solo admin puede modificar */}
              {isAdmin && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`vacation-${home.id}`} className="flex items-center gap-2">
                        <Plane className="size-4" />
                        {t('homes.vacationMode')}
                      </Label>
                      <p className="text-xs text-gray-600">
                        {t('homes.pauseAlerts')}
                      </p>
                    </div>
                    <Switch
                      id={`vacation-${home.id}`}
                      checked={home.vacationMode}
                      onCheckedChange={(checked) => handleVacationMode(home.id, checked)}
                      disabled={home.status === 'suspended'}
                    />
                  </div>
                </div>
              )}

              {/* RF10 - Acciones de suspensión - Solo admin */}
              {isAdmin && (
                <div className="flex gap-2 pt-2">
                  <Dialog open={editingHomeId === home.id} onOpenChange={(open) => setEditingHomeId(open ? home.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <Edit className="size-4" />
                        {t('homes.edit')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <form onSubmit={(e) => handleEditHome(e, home.id)}>
                        <DialogHeader>
                          <DialogTitle>{t('homes.editHomeTitle')}</DialogTitle>
                          <DialogDescription>
                            {t('homes.editHomeDesc', { homeName: home.name })}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor={`edit-home-name-${home.id}`}>{t('homes.homeName')} *</Label>
                            <Input
                              id={`edit-home-name-${home.id}`}
                              name="homeName"
                              defaultValue={home.name}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-address-${home.id}`}>{t('homes.address')} *</Label>
                            <Input
                              id={`edit-address-${home.id}`}
                              name="address"
                              defaultValue={home.address}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`edit-city-${home.id}`}>{t('homes.city')} *</Label>
                              <Input
                                id={`edit-city-${home.id}`}
                                name="city"
                                defaultValue={home.city}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor={`edit-type-${home.id}`}>{t('homes.type')} *</Label>
                              <Select name="homeType" defaultValue={home.type} required>
                                <SelectTrigger id={`edit-type-${home.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Familiar">{t('homes.familiar')}</SelectItem>
                                  <SelectItem value="Comercial">{t('homes.commercial')}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`edit-stratum-${home.id}`}>{t('homes.stratum')} *</Label>
                            <Select name="stratum" defaultValue={home.stratum} required>
                              <SelectTrigger id={`edit-stratum-${home.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">{t('homes.stratum')} 1</SelectItem>
                                <SelectItem value="2">{t('homes.stratum')} 2</SelectItem>
                                <SelectItem value="3">{t('homes.stratum')} 3</SelectItem>
                                <SelectItem value="4">{t('homes.stratum')} 4</SelectItem>
                                <SelectItem value="5">{t('homes.stratum')} 5</SelectItem>
                                <SelectItem value="6">{t('homes.stratum')} 6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setEditingHomeId(null)}>
                            {t('homes.cancel')}
                          </Button>
                          <Button type="submit">
                            {t('settings.saveChanges')}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {home.status === 'active' || home.status === 'vacation' ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="flex-1">
                          <Pause className="size-4 mr-2" />
                          {t('homes.suspend')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('homes.suspendHomeTitle')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('homes.suspendHomeDesc')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('homes.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleSuspendHome(home.id)}>
                            {t('homes.yesSuspend')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button variant="outline" className="flex-1" onClick={() => handleReactivateHome(home.id)}>
                      <Play className="size-4 mr-2" />
                      {t('homes.reactivate')}
                    </Button>
                  )}
                </div>
              )}

              {/* Mensaje para miembros sin permisos de admin */}
              {!isAdmin && userRole === 'member' && (
                <Alert className="mt-4">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs">
                    {t('homes.memberReadOnlyAlert')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Dialog open={detailsHomeId === home.id} onOpenChange={(open) => setDetailsHomeId(open ? home.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    {t('homes.viewFullDetails')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{home.name}</DialogTitle>
                    <DialogDescription>
                      {home.address}, {home.city}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-gray-600">{t('homes.devices')}</p>
                        <p className="text-2xl">{home.devices}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-gray-600">{t('homes.members')}</p>
                        <p className="text-2xl">{home.members}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-xs text-gray-600">{t('homes.monthlyConsumption')}</p>
                        <p className="text-2xl">{home.consumption} m³</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-600">{t('homes.type')}</p>
                        <p className="text-sm">{t(`homes.${home.type.toLowerCase()}`)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-600">{t('homes.stratum')}</p>
                        <p className="text-sm">{home.stratum}</p>
                      </div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{t('homes.linkedMembers')}</p>
                          <p className="text-xs text-gray-600">{t('homes.usersWithHomeAccess')}</p>
                        </div>
                        <Badge variant={isAdmin ? 'default' : 'secondary'} className={isAdmin ? 'bg-green-600' : ''}>
                          {isAdmin ? t('homes.administrator') : t('homes.member')}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        {homeMembers
                          .filter(membership => membership.homeId === home.id)
                          .map((membership) => {
                            const member = users.find(user => user.id === membership.userId);
                            if (!member) return null;

                            return (
                              <div key={membership.id} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 p-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className={`size-9 ${member.color} shrink-0 rounded-full flex items-center justify-center text-white text-sm`}>
                                    {member.initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm">{member.name}</p>
                                    <p className="truncate text-xs text-gray-600">{member.email}</p>
                                  </div>
                                </div>
                                <Badge variant={membership.role === 'admin' ? 'default' : 'outline'}>
                                  {membership.role === 'admin' ? t('homes.administrator') : t('homes.member')}
                                </Badge>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" onClick={() => setDetailsHomeId(null)}>
                      {t('common.close')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Solo admin puede eliminar el hogar */}
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <Trash2 className="size-4 mr-2" />
                      {t('homes.deleteHome')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('homes.deleteHomeTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('homes.deleteHomeDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('homes.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteHome(home.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('homes.yesDelete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>
          );
        })}
      </div>

      {/* RF7 - Gestión multiusuario por hogar y usuarios */}
      <Card>
        <CardHeader>
          <CardTitle>{t('homes.userHomeManagement')}</CardTitle>
          <CardDescription>{t('homes.userHomeManagementDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="by-home" className="w-full">
            <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs [--mobile-tabs:2] sm:!grid sm:!w-full">
              <TabsTrigger value="by-home" className="whitespace-nowrap px-3 text-xs sm:text-sm">
                {t('homes.byHome')}
              </TabsTrigger>
              <TabsTrigger value="by-user" className="whitespace-nowrap px-3 text-xs sm:text-sm">
                {t('homes.byUser')}
              </TabsTrigger>
            </TabsList>

            {/* Vista por hogar */}
            <TabsContent value="by-home" className="space-y-4">
              <div className="flex items-center justify-between">
                <Select value={selectedHomeForMembers.toString()} onValueChange={(value) => setSelectedHomeForMembers(Number(value))}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((home) => {
                      const role = getCurrentUserRole(home.id);
                      return (
                        <SelectItem key={home.id} value={home.id.toString()}>
                          {home.name} {role === 'admin' ? `(${t('homes.adminShort')})` : role === 'member' ? `(${t('homes.member')})` : ''}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Alerta si no es admin del hogar seleccionado */}
              {!isCurrentUserAdmin(selectedHomeForMembers) && (
                <Alert>
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-xs">
                    {t('homes.membersReadOnlyAlert')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {homeMembers
                  .filter(membership => membership.homeId === selectedHomeForMembers)
                  .map((membership) => {
                    const user = users.find(u => u.id === membership.userId);
                    if (!user) return null;

                    return (
                      <div key={membership.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 ${user.color} rounded-full flex items-center justify-center text-white`}>
                            {user.initials}
                          </div>
                          <div>
                            <div className="text-sm">{user.name}</div>
                            <div className="text-xs text-gray-600">{user.email}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {t('homes.memberOfHomes', { count: getUserHomes(user.id).length })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {membership.role === 'admin' ? (
                            <Badge>{t('homes.administrator')}</Badge>
                          ) : (
                            <Badge variant="outline">{t('homes.member')}</Badge>
                          )}
                          {/* Solo el admin del hogar puede eliminar miembros */}
                          {isCurrentUserAdmin(selectedHomeForMembers) && membership.role !== 'admin' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('homes.deleteMemberTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('homes.removeMemberConfirm', { userName: user.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('homes.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMember(membership.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t('homes.yesDelete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    );
                  })
                }

                {homeMembers.filter(m => m.homeId === selectedHomeForMembers).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="size-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('homes.noMembersInHome')}</p>
                  </div>
                )}

                {/* Solo el admin del hogar puede agregar miembros */}
                {isCurrentUserAdmin(selectedHomeForMembers) && (
                  <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="size-4 mr-2" />
                        {t('homes.addMember')}
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <form onSubmit={handleAddMember}>
                      <DialogHeader>
                        <DialogTitle>{t('homes.addMemberTitle')}</DialogTitle>
                        <DialogDescription>
                          {t('homes.addMemberLongDesc')}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="memberHome">{t('homes.selectHome')} *</Label>
                          <Select name="homeId" required defaultValue={selectedHomeForMembers.toString()}>
                            <SelectTrigger id="memberHome">
                              <SelectValue placeholder={t('homes.selectHomeToAdd')} />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Solo mostrar hogares donde el usuario actual es admin */}
                              {homes.filter(home => isCurrentUserAdmin(home.id)).map((home) => (
                                <SelectItem key={home.id} value={home.id.toString()}>
                                  {home.name} - {home.address}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="memberName">{t('homes.memberName')} *</Label>
                          <Input
                            id="memberName"
                            name="memberName"
                            placeholder={t('homes.memberNamePlaceholder')}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="memberEmail">{t('homes.memberEmail')} *</Label>
                          <Input
                            id="memberEmail"
                            name="memberEmail"
                            type="email"
                            placeholder={t('homes.memberEmailPlaceholder')}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="memberRole">{t('homes.memberRole')} *</Label>
                          <Select name="memberRole" required defaultValue="member">
                            <SelectTrigger id="memberRole">
                              <SelectValue placeholder={t('homes.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">{t('homes.administrator')}</SelectItem>
                              <SelectItem value="member">{t('homes.member')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                          {t('homes.cancel')}
                        </Button>
                        <Button type="submit">
                          {t('homes.addMemberButton')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                )}
              </div>
            </TabsContent>

            {/* Vista por usuario */}
            <TabsContent value="by-user" className="space-y-4">
              <div className="space-y-3">
                {users.map((user) => {
                  const userHomes = getUserHomes(user.id);

                  return (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`size-10 ${user.color} rounded-full flex items-center justify-center text-white`}>
                            {user.initials}
                          </div>
                          <div>
                            <div className="text-sm">{user.name}</div>
                            <div className="text-xs text-gray-600">{user.email}</div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserForHome(user.id);
                            setIsAddToHomeDialogOpen(true);
                          }}
                        >
                          <UserPlus className="size-4 mr-2" />
                          {t('homes.addToHomes')}
                        </Button>
                      </div>

                      {userHomes.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600 mb-2">{t('homes.memberOfHomesList', { count: userHomes.length })}</div>
                          <div className="flex flex-wrap gap-2">
                            {userHomes.map((membership) => (
                              <Badge key={membership.id} variant="secondary" className="flex items-center gap-2">
                                <Building2 className="size-3" />
                                {membership.homeName}
                                {membership.role === 'admin' && <span className="text-xs">({t('homes.adminShort')})</span>}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          {t('homes.noHomesAssigned')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo para agregar usuario existente a múltiples hogares */}
      <Dialog open={isAddToHomeDialogOpen} onOpenChange={setIsAddToHomeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleAddUserToHome}>
            <DialogHeader>
              <DialogTitle>{t('homes.addUserToHomesTitle')}</DialogTitle>
              <DialogDescription>
                {t('homes.addUserToHomesDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <input type="hidden" name="userId" value={selectedUserForHome || ''} />

              <div className="space-y-2">
                <Label>{t('homes.selectedUser')}</Label>
                <div className="p-3 border rounded-lg bg-gray-50">
                  {selectedUserForHome && users.find(u => u.id === selectedUserForHome) && (
                    <div className="flex items-center gap-3">
                      <div className={`size-10 ${users.find(u => u.id === selectedUserForHome)!.color} rounded-full flex items-center justify-center text-white`}>
                        {users.find(u => u.id === selectedUserForHome)!.initials}
                      </div>
                      <div>
                        <div className="text-sm">{users.find(u => u.id === selectedUserForHome)!.name}</div>
                        <div className="text-xs text-gray-600">{users.find(u => u.id === selectedUserForHome)!.email}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('homes.selectHomesAsAdmin')} *</Label>
                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {/* Solo mostrar hogares donde el usuario actual es admin */}
                  {homes.filter(home => isCurrentUserAdmin(home.id)).map((home) => {
                    const isMember = selectedUserForHome && homeMembers.some(
                      m => m.userId === selectedUserForHome && m.homeId === home.id
                    );

                    return (
                      <label key={home.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          name="homeIds"
                          value={home.id}
                          disabled={isMember}
                          className="size-4"
                        />
                        <div className="flex-1">
                          <div className="text-sm flex items-center gap-2">
                            <Building2 className="size-4" />
                            {home.name}
                            {isMember && <Badge variant="outline" className="text-xs">{t('homes.alreadyMember')}</Badge>}
                          </div>
                          <div className="text-xs text-gray-600">{home.address}</div>
                        </div>
                      </label>
                    );
                  })}
                  {homes.filter(home => isCurrentUserAdmin(home.id)).length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {t('homes.noAdminHomes')}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userHomeRole">{t('homes.roleInHomes')} *</Label>
                <Select name="memberRole" required defaultValue="member">
                  <SelectTrigger id="userHomeRole">
                    <SelectValue placeholder={t('homes.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('homes.administrator')}</SelectItem>
                    <SelectItem value="member">{t('homes.member')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setIsAddToHomeDialogOpen(false);
                setSelectedUserForHome(null);
              }}>
                {t('homes.cancel')}
              </Button>
              <Button type="submit">
                {t('homes.addToHomes')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MembershipRequestsPanel />
    </div>
  );
}

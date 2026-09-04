import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  BarChart3,
  Bell,
  Settings,
  Building2,
  Droplets,
  Target,
  Users,
  LogOut,
  Menu,
  X,
  Shield,
  Wrench,
  Database,
  Palette,
} from 'lucide-react';
import logoImage from '@/imports/aaa-Photoroom-1.png';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@shared/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@shared/ui/alert-dialog';
import { DashboardHome } from '@features/dashboard/pages/DashboardPage';
import { HomeManagement } from '@features/homes/pages/HomesPage';
import { DeviceManagement } from '@features/devices/pages/DevicesPage';
import { ReportsAnalytics } from '@features/reports/pages/ReportsPage';
import { NotificationsPanel } from '@features/alerts/pages/AlertsPage';
import { AccountSettings } from '@features/settings/pages/SettingsPage';
import { GoalsConfig } from '@features/goals/pages/GoalsPage';
import { AdminPanel } from '@features/admin/pages/AdminPage';
import { TechnicianPanel } from '@features/support/pages/TechnicianPage';
import { AuditLog } from '@features/admin/audit/AuditPage';
import { SupportTickets } from '@features/support/pages/SupportPage';
import { useTheme } from '@app/providers/ThemeProvider';
import { toast } from 'sonner';
import { homesApi, userApi } from '@shared/http/httpClient';

interface DashboardLayoutProps {
  userRole: 'admin' | 'technician' | 'user';
  onLogout: () => void;
}

// RNF2.1 - Interfaz intuitiva y comprensible
// RNF7.2 - Cumplimiento WCAG 2.1 para accesibilidad
// RNF7.3 - Multiplataforma (móviles, tablets y escritorio)
export function DashboardLayout({ userRole, onLogout }: DashboardLayoutProps) {
  const [activeView, setActiveView] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [homes, setHomes] = useState<Array<{ homeId: string; name: string }>>([]);
  const [selectedHomeId, setSelectedHomeId] = useState('');
  const [profile, setProfile] = useState<{ fullName?: string; email?: string }>({});
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    Promise.all([homesApi.list(), userApi.me()])
      .then(([homesResponse, userResponse]) => {
        const availableHomes =
          (homesResponse.data as Array<{ homeId: string; name: string }>) || [];
        setHomes(availableHomes);
        setSelectedHomeId((current) => current || availableHomes[0]?.homeId || '');
        setProfile(userResponse.data as { fullName?: string; email?: string });
      })
      .catch(() => {
        setHomes([]);
        setSelectedHomeId('');
      });
  }, []);

  // RF6.2, RF20.1 - Menús según el rol del usuario
  const getMenuItems = () => {
    const baseItems = [
      {
        id: 'dashboard',
        label: t('nav.home'),
        icon: Home,
        roles: ['admin', 'technician', 'user'],
        ariaLabel: t('nav.home'),
      },
    ];

    const adminItems = [
      {
        id: 'admin-panel',
        label: t('nav.adminPanel'),
        icon: Shield,
        roles: ['admin'],
        ariaLabel: t('nav.adminPanel'),
      },
      {
        id: 'users',
        label: t('nav.users'),
        icon: Users,
        roles: ['admin'],
        ariaLabel: t('nav.users'),
      },
      {
        id: 'audit',
        label: t('nav.audit'),
        icon: Database,
        roles: ['admin'],
        ariaLabel: t('nav.audit'),
      },
    ];

    const technicianItems = [
      {
        id: 'technician-panel',
        label: t('nav.technicianPanel'),
        icon: Wrench,
        roles: ['technician'],
        ariaLabel: t('nav.technicianPanel'),
      },
    ];

    const userItems = [
      {
        id: 'homes',
        label: t('nav.homes'),
        icon: Building2,
        roles: ['user'],
        ariaLabel: t('nav.homes'),
      },
      {
        id: 'devices',
        label: t('nav.devices'),
        icon: Droplets,
        roles: ['admin', 'technician', 'user'],
        ariaLabel: t('nav.devices'),
      },
      {
        id: 'reports',
        label: t('nav.reports'),
        icon: BarChart3,
        roles: ['admin', 'user'],
        ariaLabel: t('nav.reports'),
      },
      {
        id: 'goals',
        label: t('nav.goals'),
        icon: Target,
        roles: ['user'],
        ariaLabel: t('nav.goals'),
      },
      {
        id: 'notifications',
        label: t('nav.notifications'),
        icon: Bell,
        roles: ['admin', 'technician', 'user'],
        ariaLabel: t('nav.notifications'),
      },
      {
        id: 'support',
        label: t('nav.support'),
        icon: Users,
        roles: ['admin', 'technician', 'user'],
        ariaLabel: t('nav.support'),
      },
      {
        id: 'settings',
        label: t('nav.settings'),
        icon: Settings,
        roles: ['admin', 'technician', 'user'],
        ariaLabel: t('nav.settings'),
      },
    ];

    const allItems = [...baseItems, ...adminItems, ...technicianItems, ...userItems];

    // RF20.2 - Filtrar según el rol para restringir vistas
    return allItems.filter((item) => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  // Información del usuario según el rol
  const getUserInfo = () => {
    const name = profile.fullName || profile.email || t('roles.user');
    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'HS';
    switch (userRole) {
      case 'admin':
        return { name, email: profile.email || '', initials, color: 'bg-red-600' };
      case 'technician':
        return { name, email: profile.email || '', initials, color: 'bg-orange-600' };
      case 'user':
        return { name, email: profile.email || '', initials, color: 'bg-blue-600' };
    }
  };

  const userInfo = getUserInfo();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'default' | 'dark' | 'green' | 'ocean');
    toast.success(t('settings.changesSaved'), {
      description: `${t('settings.theme')}: ${t(`themes.${newTheme}`)}`,
    });
  };

  // RF3.4 - Función para cerrar sesión de manera segura
  const handleLogout = () => {
    // RF19.1 - Registrar cierre de sesión en auditoría
    onLogout();
  };

  // RF20.1 - Renderizar vista según permisos
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome userRole={userRole} homeId={selectedHomeId} />;
      case 'admin-panel':
        return userRole === 'admin' ? (
          <AdminPanel />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'users':
        return userRole === 'admin' ? (
          <div className="text-center py-12 text-gray-600">
            {t('nav.users')} - {t('common.inDevelopment')}
          </div>
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'audit':
        return userRole === 'admin' ? (
          <AuditLog />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'support':
        return <SupportTickets />;
      case 'technician-panel':
        return userRole === 'technician' ? (
          <TechnicianPanel />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'homes':
        return <HomeManagement />;
      case 'devices':
        return <DeviceManagement userRole={userRole} />;
      case 'reports':
        return <ReportsAnalytics homeId={selectedHomeId} />;
      case 'goals':
        return <GoalsConfig homeId={selectedHomeId} />;
      case 'notifications':
        return <NotificationsPanel homeId={selectedHomeId} />;
      case 'settings':
        return <AccountSettings userRole={userRole} />;
      default:
        return <DashboardHome userRole={userRole} homeId={selectedHomeId} />;
    }
  };

  // RNF2.2 - Navegación para móvil usando Sheet (RNF7.3)
  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label={t('common.openNavigationMenu')}
        >
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[min(20rem,85vw)] p-0 [&>button:last-child]:text-white [&>button:last-child]:hover:bg-blue-800/40 [&>button:last-child]:focus:ring-white"
      >
        <SheetHeader className="p-6 bg-blue-900 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <img src={logoImage} alt="HidroSmart Logo" className="h-12 w-auto" />
            </div>
            <SheetTitle className="text-white text-2xl hidrosmart-logo">{t('app.name')}</SheetTitle>
          </div>
          <SheetDescription className="text-blue-100">{t('app.tagline')}</SheetDescription>
          <div className="mt-4">
            <Badge
              className={`${
                userRole === 'admin'
                  ? 'bg-red-600'
                  : userRole === 'technician'
                    ? 'bg-orange-600'
                    : 'bg-green-600'
              } text-white`}
            >
              {userRole === 'admin'
                ? `👑 ${t('roles.admin')}`
                : userRole === 'technician'
                  ? `🔧 ${t('roles.technician')}`
                  : `👤 ${t('roles.user')}`}
            </Badge>
          </div>
        </SheetHeader>

        <nav className="p-4 space-y-2" role="navigation" aria-label="Menú principal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 dark:border-slate-600 dark:bg-[#151f32] dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-[#1d2b45] dark:hover:text-white'
                }`}
                aria-label={item.ariaLabel}
                aria-current={activeView === item.id ? 'page' : undefined}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start border border-gray-200 text-red-600 hover:bg-red-50 dark:border-slate-600 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-200"
                aria-label={t('auth.logout')}
              >
                <LogOut className="size-5 mr-3" aria-hidden="true" />
                {t('auth.logout')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('auth.logout')}?</AlertDialogTitle>
                <AlertDialogDescription>{t('common.logoutConfirmation')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>{t('auth.logout')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="flex h-dvh min-w-0 bg-gray-50">
      {/* RNF26.1 - Sidebar para desktop (oculto en móvil) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-blue-900 text-white">
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <img src={logoImage} alt="HidroSmart Logo" className="h-12 w-auto" />
            </div>
            <h1 className="text-2xl hidrosmart-logo">{t('app.name')}</h1>
          </div>

          {/* Badge de rol */}
          <div className="mb-6">
            <Badge
              className={`${
                userRole === 'admin'
                  ? 'bg-red-600'
                  : userRole === 'technician'
                    ? 'bg-orange-600'
                    : 'bg-green-600'
              } text-white`}
            >
              {userRole === 'admin'
                ? `👑 ${t('roles.admin')}`
                : userRole === 'technician'
                  ? `🔧 ${t('roles.technician')}`
                  : `👤 ${t('roles.user')}`}
            </Badge>
          </div>

          <nav className="space-y-2" role="navigation" aria-label="Menú principal">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeView === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                  aria-label={item.ariaLabel}
                  aria-current={activeView === item.id ? 'page' : undefined}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* RF3.4 - Cerrar sesión */}
        <div className="p-4 border-t border-blue-800">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-blue-100 hover:bg-blue-800 hover:text-white"
                aria-label={t('auth.logout')}
              >
                <LogOut className="size-5 mr-3" aria-hidden="true" />
                {t('auth.logout')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('auth.logout')}?</AlertDialogTitle>
                <AlertDialogDescription>{t('common.logoutConfirmation')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>{t('auth.logout')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* RNF26.1 - Header responsive */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MobileNavigation />
              <div className="min-w-0">
                <h1 className="truncate text-lg sm:text-xl lg:text-2xl text-gray-900">
                  {menuItems.find((item) => item.id === activeView)?.label || t('nav.home')}
                </h1>
                <p className="truncate text-xs lg:text-sm text-gray-600 mt-0.5">
                  {t('app.tagline')}
                </p>
              </div>
            </div>

            {/* Usuario info */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3 ml-auto">
              {homes.length > 0 && (
                <Select value={selectedHomeId} onValueChange={setSelectedHomeId}>
                  <SelectTrigger
                    className="hidden h-10 w-[10rem] sm:flex"
                    aria-label={t('homes.home')}
                  >
                    <SelectValue placeholder={t('homes.home')} />
                  </SelectTrigger>
                  <SelectContent>
                    {homes.map((home) => (
                      <SelectItem key={home.homeId} value={home.homeId}>
                        {home.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger
                  className="h-10 w-10 rounded-full p-0 sm:w-[11rem] sm:rounded-lg sm:px-3"
                  aria-label={t('settings.theme')}
                >
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-blue-600" aria-hidden="true" />
                    <span className="hidden sm:inline">
                      <SelectValue placeholder={t('settings.selectTheme')} />
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="default">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-blue-600" aria-hidden="true" />
                      <span>{t('themes.default')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-slate-800" aria-hidden="true" />
                      <span>{t('themes.dark')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="green">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-green-600" aria-hidden="true" />
                      <span>{t('themes.green')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ocean">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-cyan-600" aria-hidden="true" />
                      <span>{t('themes.ocean')}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label="Ir a configuración del perfil"
              >
                <div className="hidden md:block text-right">
                  <div className="text-sm text-gray-600">{userInfo.name}</div>
                  <div className="text-xs text-gray-500">{userInfo.email}</div>
                </div>
                <div
                  className={`size-10 ${userInfo.color} rounded-full flex items-center justify-center text-white transition-opacity`}
                  aria-hidden="true"
                >
                  {userInfo.initials}
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* RNF26.2 - Content Area con scroll */}
        <main
          className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-4 lg:p-6"
          role="main"
          aria-label={t('common.mainContent')}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
}

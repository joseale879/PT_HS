import { lazy, Suspense, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home,
  BarChart3,
  Settings,
  Building2,
  Droplets,
  Target,
  Users,
  LogOut,
  Menu,
  PanelLeftClose,
  Shield,
  Wrench,
  Database,
  Activity,
  Lightbulb,
  Loader2,
} from 'lucide-react';
import logoImage from '@/imports/aaa-Photoroom-1.png';
import { Button } from '@shared/ui/button';
import { Badge } from '@shared/ui/badge';
import { LazyViewErrorBoundary } from '@shared/ui/LazyViewErrorBoundary';
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
import { useActiveHome } from '@app/providers/ActiveHomeProvider';
import {
  can,
  getPrimaryRole,
  hasRole,
  roleBadgeClass,
  roleTranslationKey,
  type AuthorizationContext,
  type SystemRole,
} from '@shared/config/authorization';

const DashboardHome = lazy(() =>
  import('@features/dashboard/pages/DashboardPage').then(({ DashboardHome: component }) => ({
    default: component,
  }))
);
const HomeManagement = lazy(() =>
  import('@features/homes/pages/HomesPage').then(({ HomeManagement: component }) => ({
    default: component,
  }))
);
const DeviceManagement = lazy(() =>
  import('@features/devices/pages/DevicesPage').then(({ DeviceManagement: component }) => ({
    default: component,
  }))
);
const ConsumptionPage = lazy(() =>
  import('@features/consumption/pages/ConsumptionPage').then(({ ConsumptionPage: component }) => ({
    default: component,
  }))
);
const ReportsAnalytics = lazy(() =>
  import('@features/reports/pages/ReportsPage').then(({ ReportsAnalytics: component }) => ({
    default: component,
  }))
);
const NotificationsPanel = lazy(() =>
  import('@features/alerts/pages/AlertsPage').then(({ NotificationsPanel: component }) => ({
    default: component,
  }))
);
const AccountSettings = lazy(() =>
  import('@features/settings/pages/SettingsPage').then(({ AccountSettings: component }) => ({
    default: component,
  }))
);
const GoalsConfig = lazy(() =>
  import('@features/goals/pages/GoalsPage').then(({ GoalsConfig: component }) => ({
    default: component,
  }))
);
const RecommendationsPage = lazy(() =>
  import('@features/recommendations/pages/RecommendationsPage').then(
    ({ RecommendationsPage: component }) => ({
      default: component,
    })
  )
);
const AdminPanel = lazy(() =>
  import('@features/admin/pages/AdminPage').then(({ AdminPanel: component }) => ({
    default: component,
  }))
);
const UserManagementPage = lazy(() =>
  import('@features/admin/users/UserManagementPage').then(({ UserManagementPage: component }) => ({
    default: component,
  }))
);
const AuditLog = lazy(() =>
  import('@features/admin/audit/AuditPage').then(({ AuditLog: component }) => ({
    default: component,
  }))
);
const SupportTickets = lazy(() =>
  import('@features/support/pages/SupportPage').then(({ SupportTickets: component }) => ({
    default: component,
  }))
);

const viewPaths: Record<string, string> = {
  dashboard: '/app',
  'admin-panel': '/app/admin',
  users: '/app/users',
  audit: '/app/audit',
  'support-panel': '/app/support/management',
  homes: '/app/homes',
  devices: '/app/devices',
  consumption: '/app/consumption',
  reports: '/app/reports',
  goals: '/app/goals',
  recommendations: '/app/recommendations',
  notifications: '/app/alerts',
  support: '/app/support',
  settings: '/app/settings',
};

type MenuItem = {
  id: string;
  label: string;
  icon: typeof Home;
  ariaLabel: string;
  requiredPermission?: string;
  requiredRoles?: SystemRole[];
};

function getViewFromPath(pathname: string): string {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return Object.entries(viewPaths).find(([, path]) => path === normalizedPath)?.[0] || 'dashboard';
}

interface DashboardLayoutProps {
  session: AuthorizationContext & {
    fullName?: string;
    email?: string;
  };
  onLogout: () => void | Promise<void>;
}

// RNF2.1 - Interfaz intuitiva y comprensible
// RNF7.2 - Cumplimiento WCAG 2.1 para accesibilidad
// RNF7.3 - Multiplataforma (móviles, tablets y escritorio)
export function DashboardLayout({ session, onLogout }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const { homes, homeId: selectedHomeId, setHomeId: setSelectedHomeId } = useActiveHome();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const primaryRole = getPrimaryRole(session.roles);
  const roleLabel = t(roleTranslationKey(primaryRole));
  const roleIcon =
    primaryRole === 'Administrator'
      ? '👑'
      : primaryRole === 'Support'
        ? '🛠️'
        : primaryRole === 'HomeUser'
          ? '🏠'
          : '👁️';
  const canManageRoles = can(session.permissions, 'roles.manage');
  const canManageUsers = can(session.permissions, 'users.manage');
  const canReadAudit = can(session.permissions, 'audit.read');
  const canManageTickets = can(session.permissions, 'tickets.manage');
  const isAdministrator = hasRole(session.roles, 'Administrator');
  const activeView = getViewFromPath(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const profile = { fullName: session.fullName };

  // La visibilidad se resuelve con permisos funcionales devueltos por BK_HS.
  // La base de datos y sus políticas RLS continúan siendo la barrera final.
  const getMenuItems = () => {
    const adminItems: MenuItem[] = [
      {
        id: 'admin-panel',
        label: t('nav.adminPanel'),
        icon: Shield,
        requiredPermission: 'roles.manage',
        requiredRoles: ['Administrator'],
        ariaLabel: t('nav.adminPanel'),
      },
      {
        id: 'users',
        label: t('nav.users'),
        icon: Users,
        requiredPermission: 'users.manage',
        requiredRoles: ['Administrator'],
        ariaLabel: t('nav.users'),
      },
      {
        id: 'audit',
        label: t('nav.audit'),
        icon: Database,
        requiredPermission: 'audit.read',
        requiredRoles: ['Administrator'],
        ariaLabel: t('nav.audit'),
      },
    ];

    const supportItems: MenuItem[] = [
      {
        id: 'support-panel',
        label: t('nav.supportPanel'),
        icon: Wrench,
        requiredPermission: 'tickets.manage',
        requiredRoles: ['Support'],
        ariaLabel: t('nav.supportPanel'),
      },
    ];

    const baseItems: MenuItem[] = [
      {
        id: 'dashboard',
        label: t('nav.home'),
        icon: Home,
        requiredRoles: ['HomeUser', 'Guest'],
        ariaLabel: t('nav.home'),
      },
    ];

    const userItems: MenuItem[] = [
      {
        id: 'homes',
        label: t('nav.homes'),
        icon: Building2,
        ariaLabel: t('nav.homes'),
      },
      {
        id: 'devices',
        label: t('nav.devices'),
        icon: Droplets,
        ariaLabel: t('nav.devices'),
      },
      {
        id: 'consumption',
        label: t('nav.consumption'),
        icon: Activity,
        requiredPermission: 'consumption.read',
        ariaLabel: t('nav.consumption'),
      },
      {
        id: 'reports',
        label: t('nav.reports'),
        icon: BarChart3,
        requiredPermission: 'reports.read',
        ariaLabel: t('nav.reports'),
      },
      {
        id: 'goals',
        label: t('nav.goals'),
        icon: Target,
        requiredPermission: 'homes.manage',
        ariaLabel: t('nav.goals'),
      },
      {
        id: 'recommendations',
        label: t('nav.recommendations'),
        icon: Lightbulb,
        requiredPermission: 'reports.read',
        ariaLabel: t('nav.recommendations'),
      },
      {
        id: 'settings',
        label: t('nav.settings'),
        icon: Settings,
        ariaLabel: t('nav.settings'),
      },
    ];

    const settingsItem = userItems.find((item) => item.id === 'settings');
    const normalUserItems = userItems.filter((item) => item.id !== 'settings');
    const allItems = isAdministrator
      ? [...adminItems, ...(settingsItem ? [settingsItem] : [])]
      : hasRole(session.roles, 'Support')
        ? [...supportItems, ...(settingsItem ? [settingsItem] : [])]
        : [...baseItems, ...normalUserItems, ...(settingsItem ? [settingsItem] : [])];

    return allItems.filter(
      (item) =>
        (item.requiredRoles?.some((role) => hasRole(session.roles, role)) ?? true) &&
        (item.requiredPermission ? can(session.permissions, item.requiredPermission) : true)
    );
  };

  const menuItems = getMenuItems();

  // Presentación del rol funcional, sin traducirlo a nombres internos.
  const getUserInfo = () => {
    const name = profile.fullName || roleLabel;
    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase() || 'HS';
    return { name, initials, color: roleBadgeClass(primaryRole) };
  };

  const userInfo = getUserInfo();

  // La navegación oculta opciones, pero la URL también debe respetar el mismo
  // contrato de autorización cuando se escribe directamente en el navegador.
  const viewPermissions: Record<string, string> = {
    'admin-panel': 'roles.manage',
    users: 'users.manage',
    audit: 'audit.read',
    'support-panel': 'tickets.manage',
    consumption: 'consumption.read',
    reports: 'reports.read',
    goals: 'homes.manage',
    recommendations: 'reports.read',
    notifications: 'alerts.manage',
    support: 'tickets.manage',
  };

  const viewRoles: Record<string, SystemRole[]> = {
    dashboard: ['HomeUser', 'Guest'],
    'admin-panel': ['Administrator'],
    users: ['Administrator'],
    audit: ['Administrator'],
    'support-panel': ['Support'],
    notifications: [],
    support: [],
    homes: ['HomeUser', 'Guest'],
    devices: ['HomeUser', 'Guest'],
    consumption: ['HomeUser', 'Guest'],
    reports: ['HomeUser', 'Guest'],
    goals: ['HomeUser'],
    recommendations: ['HomeUser', 'Guest'],
  };

  // RF3.4 - Función para cerrar sesión de manera segura
  const handleLogout = () => {
    // RF19.1 - Registrar cierre de sesión en auditoría
    onLogout();
  };

  const RoleBadge = () => (
    <Badge className={`${roleBadgeClass(primaryRole)} text-white`}>
      {roleIcon} {roleLabel}
    </Badge>
  );

  // RF20.1 - Renderizar vista según permisos
  const renderView = () => {
    const requiredPermission = viewPermissions[activeView];
    const requiredRoles = viewRoles[activeView];
    const hasRequiredRole =
      !requiredRoles || requiredRoles.some((role) => hasRole(session.roles, role));
    if (!hasRequiredRole || (requiredPermission && !can(session.permissions, requiredPermission))) {
      return <div className="py-12 text-center text-red-600">{t('common.accessDenied')}</div>;
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardHome homeId={selectedHomeId} />;
      case 'admin-panel':
        return canManageRoles ? (
          <AdminPanel />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'users':
        return canManageUsers ? (
          <UserManagementPage />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'audit':
        return canReadAudit ? (
          <AuditLog />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'support':
        return <SupportTickets management />;
      case 'support-panel':
        return canManageTickets ? (
          <SupportTickets management />
        ) : (
          <div className="text-center py-12 text-red-600">{t('common.accessDenied')}</div>
        );
      case 'homes':
        return <HomeManagement permissions={session.permissions} />;
      case 'devices':
        return (
          <DeviceManagement
            permissions={session.permissions}
            homeId={selectedHomeId}
            homes={homes}
            onHomeChange={setSelectedHomeId}
          />
        );
      case 'consumption':
        return <ConsumptionPage homeId={selectedHomeId} />;
      case 'reports':
        return <ReportsAnalytics homeId={selectedHomeId} />;
      case 'goals':
        return <GoalsConfig homeId={selectedHomeId} />;
      case 'recommendations':
        return <RecommendationsPage homeId={selectedHomeId} />;
      case 'notifications':
        return <NotificationsPanel homeId={selectedHomeId} />;
      case 'settings':
        return <AccountSettings roles={session.roles} homeId={selectedHomeId} />;
      default:
        return <DashboardHome homeId={selectedHomeId} />;
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
            <RoleBadge />
          </div>
        </SheetHeader>

        <nav className="p-4 space-y-2" role="navigation" aria-label={t('common.mainNavigation')}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(viewPaths[item.id]);
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
    <div className="flex h-dvh min-w-0 bg-gray-50 pt-[env(safe-area-inset-top)]">
      {/* RNF26.1 - Sidebar para desktop (oculto en móvil) */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-blue-900 text-white transition-[width] duration-200 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-3' : 'p-6'}`}>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <img src={logoImage} alt="HidroSmart Logo" className="h-12 w-auto" />
            </div>
            <h1 className={`text-2xl hidrosmart-logo ${sidebarCollapsed ? 'hidden' : ''}`}>
              {t('app.name')}
            </h1>
          </div>

          {/* Badge de rol */}
          <div className={`mb-6 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
            {sidebarCollapsed ? (
              <span className="text-xl" title={roleLabel} aria-label={roleLabel}>
                {roleIcon}
              </span>
            ) : (
              <RoleBadge />
            )}
          </div>

          <nav className="space-y-2" role="navigation" aria-label={t('common.mainNavigation')}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(viewPaths[item.id])}
                  className={`w-full flex items-center rounded-lg py-3 transition-colors ${
                    sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
                  } ${
                    activeView === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-100 hover:bg-blue-800'
                  }`}
                  aria-label={item.ariaLabel}
                  aria-current={activeView === item.id ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  <span className={sidebarCollapsed ? 'hidden' : ''}>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* RF3.4 - Cerrar sesión */}
        <div className={`border-t border-blue-800 ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full text-blue-100 hover:bg-blue-800 hover:text-white ${
                  sidebarCollapsed ? 'justify-center px-2' : 'justify-start'
                }`}
                aria-label={t('auth.logout')}
                title={sidebarCollapsed ? t('auth.logout') : undefined}
              >
                <LogOut className={`size-5 ${sidebarCollapsed ? '' : 'mr-3'}`} aria-hidden="true" />
                <span className={sidebarCollapsed ? 'hidden' : ''}>{t('auth.logout')}</span>
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
                aria-label={t(
                  sidebarCollapsed ? 'common.expandNavigationMenu' : 'common.collapseNavigationMenu'
                )}
                aria-expanded={!sidebarCollapsed}
              >
                {sidebarCollapsed ? (
                  <Menu className="size-5" aria-hidden="true" />
                ) : (
                  <PanelLeftClose className="size-5" aria-hidden="true" />
                )}
              </Button>
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
              <button
                type="button"
                onClick={() => navigate(viewPaths.settings)}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                aria-label={t('common.userProfile')}
              >
                <div className="hidden md:block text-right">
                  <div className="text-sm text-gray-600">{userInfo.name}</div>
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
          <LazyViewErrorBoundary
            key={activeView}
            title={t('common.featureLoadError')}
            retryLabel={t('common.retry')}
          >
            <Suspense
              fallback={
                <div className="flex min-h-40 items-center justify-center text-sm text-gray-600">
                  <Loader2 className="mr-2 size-5 animate-spin" />
                  {t('common.loading')}
                </div>
              }
            >
              {renderView()}
            </Suspense>
          </LazyViewErrorBoundary>
        </main>
      </div>
    </div>
  );
}

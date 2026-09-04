import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Switch } from '@shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
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
import {
  User,
  Mail,
  Lock,
  Globe,
  MapPin,
  Shield,
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Plane,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { VacationMode } from '@features/vacation/pages/VacationPage';
import { LanguageSelector } from '@shared/ui/LanguageSelector';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { authApi } from '@features/auth/api/auth.api';
import { userApi } from '@shared/http/apiClient';

interface AccountSettingsProps {
  userRole: 'admin' | 'technician' | 'user';
}

type ProfileForm = {
  fullName: string;
  email: string;
  documentType: 'CC' | 'CE' | '';
  documentNumber: string;
  phone: string;
  city: string;
};

export function AccountSettings({ userRole }: AccountSettingsProps) {
  const { t } = useTranslation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mobileSessionClosed, setMobileSessionClosed] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<ProfileForm>({
    fullName: '',
    email: '',
    documentType: '',
    documentNumber: '',
    phone: '',
    city: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let active = true;
    userApi
      .me()
      .then(({ data }) => {
        if (!active) return;
        const user = data as Partial<ProfileForm>;
        setProfile({
          fullName: user.fullName || '',
          email: user.email || '',
          documentType: user.documentType === 'CE' ? 'CE' : user.documentType === 'CC' ? 'CC' : '',
          documentNumber: user.documentNumber || '',
          phone: user.phone || '',
          city: user.city || '',
        });
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar tu información')
      )
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // RF6.2 - Actualizar datos personales
  const handleSaveProfile = async () => {
    try {
      await userApi.updateMe({
        fullName: profile.fullName,
        phone: profile.phone,
        city: profile.city,
      });
      toast.success(t('settings.profileUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los cambios');
    }
  };

  // RF4.3 - Cambiar contraseña
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast.error('Verifica las contraseñas ingresadas');
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.passwordUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible cambiar la contraseña');
    }
  };

  const handleCloseMobileSession = () => {
    setMobileSessionClosed(true);
    toast.success(t('settings.sessionClosed'), {
      description: t('settings.mobileSessionClosed'),
    });
  };

  const handleCloseAllSessions = () => {
    setMobileSessionClosed(true);
    toast.success(t('settings.sessionsClosed'), {
      description: t('settings.allSessionsClosed'),
    });
  };

  // RF5.1 - Eliminar cuenta
  const handleDeleteAccount = () => {
    toast.success(t('settings.deleteRequestSent'), {
      description: t('settings.deleteConfirmationEmail'),
    });
  };

  // RF7.2 - Exportar datos personales
  const handleExportData = () => {
    toast.success(t('settings.exportStarted'), {
      description: t('settings.exportStartedDesc'),
    });
  };

  const handleChangePhoto = () => {
    toast.info(t('settings.profilePhoto'), {
      description: t('settings.photoUploadSimulated'),
    });
  };

  const handleCancelProfile = () => {
    toast.info(t('settings.changesDiscarded'));
  };

  const handleSavePreferences = () => {
    toast.success(t('settings.preferencesSaved'));
  };

  return (
    <div className="space-y-6">
      {/* Mostrar badge de rol */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm text-gray-600">{t('settings.accountType')}</div>
              <div className="text-2xl mt-1">
                {userRole === 'admin'
                  ? t('settings.systemAdministrator')
                  : userRole === 'technician'
                    ? t('settings.specializedTechnician')
                    : t('settings.endUser')}
              </div>
            </div>
            <Badge
              className={`text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 ${
                userRole === 'admin'
                  ? 'bg-red-600'
                  : userRole === 'technician'
                    ? 'bg-orange-600'
                    : 'bg-green-600'
              }`}
            >
              {userRole === 'admin'
                ? `👑 ${t('roles.admin')}`
                : userRole === 'technician'
                  ? `🔧 ${t('roles.technician')}`
                  : `👤 ${t('roles.user')}`}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs [--mobile-tabs:2] sm:!grid sm:!w-full sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="profile" className="whitespace-nowrap px-3 text-xs sm:text-sm">
            {t('settings.profile')}
          </TabsTrigger>
          <TabsTrigger value="security" className="whitespace-nowrap px-3 text-xs sm:text-sm">
            {t('settings.security')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="whitespace-nowrap px-3 text-xs sm:text-sm">
            {t('settings.privacy')}
          </TabsTrigger>
          <TabsTrigger value="preferences" className="whitespace-nowrap px-3 text-xs sm:text-sm">
            {t('settings.preferences')}
          </TabsTrigger>
          <TabsTrigger value="account" className="whitespace-nowrap px-3 text-xs sm:text-sm">
            {t('settings.accountTab')}
          </TabsTrigger>
        </TabsList>

        {/* RF6 - Gestión de cuenta - Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.personalInfo')}</CardTitle>
              <CardDescription>{t('settings.managePersonalInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="size-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl">
                  {profile.fullName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join('')
                    .toUpperCase() || 'HS'}
                </div>
                <div>
                  <Button variant="outline" size="sm" onClick={handleChangePhoto}>
                    {t('settings.changePhoto')}
                  </Button>
                  <p className="text-xs text-gray-600 mt-2">{t('settings.photoFormats')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RF6.1 - Mostrar información del usuario */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('settings.fullName')} *</Label>
                  <Input
                    id="fullName"
                    value={profile.fullName}
                    disabled={profileLoading}
                    onChange={(event) => setProfile({ ...profile, fullName: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')} *</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                  <p className="text-xs text-gray-600">
                    {t('settings.changeEmailRequiresVerification')}
                  </p>
                </div>

                {/* RF1.1 - Tipo de documento (C.C/C.E) */}
                <div className="space-y-2">
                  <Label htmlFor="docType">{t('settings.documentType')} *</Label>
                  <Select
                    value={profile.documentType}
                    disabled
                    onValueChange={(value: 'CC' | 'CE') =>
                      setProfile({ ...profile, documentType: value })
                    }
                  >
                    <SelectTrigger id="docType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CC">{t('settings.citizenshipId')}</SelectItem>
                      <SelectItem value="CE">{t('settings.foreignerId')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docNumber">{t('settings.documentNumber')} *</Label>
                  <Input id="docNumber" value={profile.documentNumber} disabled />
                  <p className="text-xs text-gray-600">{t('settings.documentCannotBeModified')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('settings.phone')}</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    disabled={profileLoading}
                    onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('settings.city')}</Label>
                  <Input
                    id="city"
                    value={profile.city}
                    disabled={profileLoading}
                    onChange={(event) => setProfile({ ...profile, city: event.target.value })}
                  />
                </div>
              </div>

              {/* RF6.2 - Verificación por email para cambios */}
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription className="text-sm">
                  {t('settings.sensitiveChangesRequireEmailVerification')}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleSaveProfile}>{t('settings.saveChanges')}</Button>
                <Button variant="outline" onClick={handleCancelProfile}>
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RF4 - Seguridad */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* RF4.1 - Cambiar contraseña desde el perfil */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>{t('settings.updateAccessPassword')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('settings.currentPassword')} *</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* RF1.2 - Requisitos de contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')} *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">{t('settings.passwordRequirementsFull')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmNewPassword')} *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {/* RF4.4 - Confirmación de cambio */}
                <Alert>
                  <Shield className="size-4" />
                  <AlertDescription className="text-sm">
                    {t('settings.passwordChangeConfirmationNotice')}
                  </AlertDescription>
                </Alert>

                <Button onClick={handleChangePassword}>{t('settings.changePassword')}</Button>
              </CardContent>
            </Card>

            {/* RF37, RF38 - Sesiones activas con JWT */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.activeSessions')}</CardTitle>
                <CardDescription>{t('settings.activeSessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm">{t('settings.chromeWindows')}</div>
                    <div className="text-xs text-gray-600">{t('settings.activeNowLocation')}</div>
                    <div className="text-xs text-gray-500 mt-1">Token: ••••••••</div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="size-3 mr-1" />
                    {t('settings.thisDevice')}
                  </Badge>
                </div>

                {!mobileSessionClosed && (
                  <div className="flex flex-col gap-3 p-4 border rounded-lg sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm">{t('settings.androidMobileApp')}</div>
                      <div className="text-xs text-gray-600">
                        {t('settings.twoHoursAgoLocation')}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Token: ••••••••</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCloseMobileSession}>
                      {t('auth.logout')}
                    </Button>
                  </div>
                )}

                {/* RF38.4 - Invalidar todos los Refresh Tokens */}
                <Button variant="destructive" className="w-full" onClick={handleCloseAllSessions}>
                  {t('settings.closeAllSessions')}
                </Button>

                <Alert>
                  <Shield className="size-4" />
                  <AlertDescription className="text-sm">
                    {t('settings.jwtSessionsNotice')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RF7 - Privacidad */}
        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.dataPrivacy')}</CardTitle>
                <CardDescription>{t('settings.dataPrivacyDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.shareConsumptionData')}</Label>
                    <p className="text-xs text-gray-600">
                      {t('settings.shareConsumptionDataDesc')}
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.usageAnalytics')}</Label>
                    <p className="text-xs text-gray-600">{t('settings.usageAnalyticsDesc')}</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                {/* RF7.4 - Registro de consentimientos */}
                <div className="pt-4 border-t">
                  <h3 className="text-sm mb-4">{t('settings.registeredConsents')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <input type="checkbox" defaultChecked disabled className="mt-1" />
                      <div className="text-xs">
                        <p>
                          {t('settings.acceptTermsPrefix')}{' '}
                          <span className="text-blue-600 cursor-pointer">
                            {t('auth.termsAndConditions')}
                          </span>
                        </p>
                        <p className="text-gray-600">{t('settings.acceptedOnDate')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <input type="checkbox" defaultChecked disabled className="mt-1" />
                      <div className="text-xs">
                        <p>
                          {t('settings.acceptPrivacyPrefix')}{' '}
                          <span className="text-blue-600 cursor-pointer">
                            {t('auth.privacyPolicy')}
                          </span>
                        </p>
                        <p className="text-gray-600">{t('settings.acceptedOnDate')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Shield className="size-4" />
                  <AlertDescription className="text-sm">
                    {t('settings.dataProtectedNotice')}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* RF7.2 - Solicitar eliminación de datos */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.exportData')}</CardTitle>
                <CardDescription>{t('settings.exportDataDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{t('settings.exportDataLongDesc')}</p>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="size-4 mr-2" />
                  {t('settings.requestDataExport')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RF33, RF29 - Preferencias */}
        <TabsContent value="preferences">
          <div className="space-y-6">
            {/* RF33 - Internacionalización */}
            <LanguageSelector />

            {/* Unidades y formatos */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.unitsAndFormats')}</CardTitle>
                <CardDescription>{t('settings.configureDisplayPreferences')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select defaultValue="bogota">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bogota">América/Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="mexico">América/México (GMT-6)</SelectItem>
                      <SelectItem value="argentina">América/Buenos Aires (GMT-3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* RF33.3 - Unidades de medida */}
                <div className="space-y-2">
                  <Label htmlFor="units">{t('settings.unitSystem')}</Label>
                  <Select defaultValue="metric">
                    <SelectTrigger id="units">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">{t('settings.metricUnits')}</SelectItem>
                      <SelectItem value="imperial">{t('settings.imperialUnits')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleSavePreferences}>{t('settings.savePreferences')}</Button>
              </CardContent>
            </Card>

            {/* RF12.3 - Ubicación */}
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.location')}</CardTitle>
                <CardDescription>{t('settings.locationDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('settings.locationPermissions')}</Label>
                  <Select defaultValue="inuse">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="always">{t('settings.allowAlways')}</SelectItem>
                      <SelectItem value="inuse">{t('settings.allowWhileUsing')}</SelectItem>
                      <SelectItem value="never">{t('settings.allowNever')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">{t('settings.locationUsageHint')}</p>
                </div>
              </CardContent>
            </Card>

            {/* RF29 - Modo Vacaciones */}
            <VacationMode />
          </div>
        </TabsContent>

        {/* RF5 - Eliminación de cuenta */}
        <TabsContent value="account">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.accountInfo')}</CardTitle>
                <CardDescription>{t('settings.accountInfoDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">{t('settings.registrationDate')}</div>
                    <div className="text-sm">{t('settings.registrationDateValue')}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('settings.accountType')}</div>
                    <Badge>
                      {userRole === 'admin'
                        ? t('roles.admin')
                        : userRole === 'technician'
                          ? t('roles.technician')
                          : t('roles.user')}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('settings.registeredHomes')}</div>
                    <div className="text-sm">{t('settings.homesCount', { count: 2 })}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('settings.activeDevices')}</div>
                    <div className="text-sm">{t('settings.devicesCount', { count: 5 })}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RF5.1 - Eliminación de cuenta */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">{t('settings.dangerZone')}</CardTitle>
                <CardDescription>{t('settings.irreversibleActions')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">
                    {t('settings.deleteAccountWarning')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="text-sm">{t('settings.whenDeletingAccount')}</p>
                  <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                    <li>{t('settings.deletePersonalData')}</li>
                    <li>{t('settings.unlinkDevices')}</li>
                    <li>{t('settings.loseConsumptionHistory')}</li>
                    <li>{t('settings.deleteAssociatedHomes')}</li>
                    <li>{t('settings.cannotBeReverted')}</li>
                  </ul>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="size-4 mr-2" />
                      {t('settings.deleteMyAccount')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('settings.areYouCompletelySure')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('settings.deleteAccountConfirmDesc')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t('settings.yesDeleteMyAccount')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

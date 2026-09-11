import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import { Camera, Eye, EyeOff, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '@features/auth/api/auth.api';
import { VacationMode } from '@features/vacation/pages/VacationPage';
import { useAuth } from '@app/providers/AuthProvider';
import { devicesApi, homesApi, userApi } from '@shared/http/apiClient';
import { LanguageSelector } from '@shared/ui/LanguageSelector';
import { isValidName, normalizeNameInput } from '@shared/lib/validators';
import { toast } from 'sonner';
import {
  getPrimaryRole,
  roleBadgeClass,
  roleTranslationKey,
  type SystemRole,
} from '@shared/config/authorization';

interface AccountSettingsProps {
  roles: SystemRole[];
  homeId?: string;
}

type ProfileForm = {
  fullName: string;
  email: string;
  documentType: 'CC' | 'CE' | '';
  documentNumber: string;
  phone: string;
  city: string;
  avatarDataUrl: string | null;
};

type AccountSummary = {
  createdAt: string | null;
  homes: number | null;
  devices: number | null;
};

const emptyProfile: ProfileForm = {
  fullName: '',
  email: '',
  documentType: '',
  documentNumber: '',
  phone: '',
  city: '',
  avatarDataUrl: null,
};

export function AccountSettings({ roles, homeId }: AccountSettingsProps) {
  const { t, i18n } = useTranslation();
  const { refreshSession } = useAuth();
  const primaryRole = getPrimaryRole(roles);
  const roleLabel = t(roleTranslationKey(primaryRole));
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(emptyProfile);
  const [profileError, setProfileError] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [summary, setSummary] = useState<AccountSummary>({
    createdAt: null,
    homes: null,
    devices: null,
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([userApi.me(), homesApi.list()])
      .then(async ([userResponse, homesResponse]) => {
        const user = userResponse.data as Partial<ProfileForm & { createdAt: string }>;
        const nextProfile: ProfileForm = {
          fullName: user.fullName || '',
          email: user.email || '',
          documentType:
            user.documentType === 'CE' || user.documentType === 'CC' ? user.documentType : '',
          documentNumber: user.documentNumber || '',
          phone: user.phone || '',
          city: user.city || '',
          avatarDataUrl: user.avatarDataUrl || null,
        };
        const homes = (homesResponse.data as Array<{ homeId: string }>) || [];
        const deviceResponses = await Promise.all(
          homes.map((home) => devicesApi.list(home.homeId))
        );
        if (!active) return;
        setProfile(nextProfile);
        setSavedProfile(nextProfile);
        setSummary({
          createdAt: user.createdAt || null,
          homes: homes.length,
          devices: deviceResponses.reduce(
            (total, response) => total + (response.data as unknown[]).length,
            0
          ),
        });
      })
      .catch((error) => {
        if (active) {
          toast.error(error instanceof Error ? error.message : t('settings.profileLoadError'));
        }
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const handleSaveProfile = async () => {
    if (!isValidName(profile.fullName)) {
      const message = 'El nombre debe tener entre 3 y 60 caracteres y solo usar letras y espacios';
      setProfileError(message);
      toast.error(message);
      window.requestAnimationFrame(() => {
        const target = document.getElementById('fullName');
        if (target instanceof HTMLElement) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.focus();
        }
      });
      return;
    }
    setProfileError('');
    try {
      await userApi.updateMe({
        fullName: profile.fullName,
        phone: profile.phone,
        city: profile.city,
        avatarDataUrl: profile.avatarDataUrl,
      });
      await refreshSession();
      setSavedProfile(profile);
      toast.success(t('settings.profileUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.profileSaveError'));
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Selecciona una imagen JPG, PNG o WebP');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La foto no puede superar 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setProfile((current) => ({ ...current, avatarDataUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast.error(t('settings.passwordValidationError'));
      return;
    }
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.passwordUpdated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.passwordSaveError'));
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return '—';
    return new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(value));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-gray-600">{t('settings.accountType')}</div>
              <div className="mt-1 text-2xl">{roleLabel}</div>
            </div>
            <Badge className={`px-3 py-1.5 text-sm sm:text-lg ${roleBadgeClass(primaryRole)}`}>
              {roleLabel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs sm:!grid sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
          <TabsTrigger value="account">{t('settings.accountTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.personalInfo')}</CardTitle>
              <CardDescription>{t('settings.managePersonalInfo')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-20 overflow-hidden rounded-full bg-blue-600 text-2xl text-white">
                  {profile.avatarDataUrl ? (
                    <img src={profile.avatarDataUrl} alt="Foto de perfil" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      {profile.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'HS'}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
                  <Button type="button" variant="outline" size="sm" disabled={profileLoading} onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="mr-2 size-4" /> Cambiar foto
                  </Button>
                  <p className="text-xs text-gray-600">JPG, PNG o WebP. Máximo 2 MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('settings.fullName')} *</Label>
                  <Input
                    id="fullName"
                    className={profileError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    value={profile.fullName}
                    disabled={profileLoading}
                    onChange={(event) => {
                      setProfile({ ...profile, fullName: normalizeNameInput(event.target.value) });
                      setProfileError('');
                    }}
                    maxLength={60}
                    autoComplete="name"
                    aria-invalid={Boolean(profileError)}
                    aria-describedby={profileError ? 'fullName-error' : undefined}
                  />
                  {profileError && <p id="fullName-error" className="text-xs text-red-600">{profileError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')} *</Label>
                  <Input id="email" type="email" value={profile.email} disabled />
                  <p className="text-xs text-gray-600">{t('settings.changeEmailRequiresVerification')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="docType">{t('settings.documentType')} *</Label>
                  <Select value={profile.documentType || undefined} disabled>
                    <SelectTrigger id="docType"><SelectValue placeholder="—" /></SelectTrigger>
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
                    maxLength={60}
                    aria-label="Teléfono (máximo 60 caracteres)"
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

              <Alert>
                <Shield className="size-4" />
                <AlertDescription>{t('settings.sensitiveChangesRequireEmailVerification')}</AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button onClick={handleSaveProfile} disabled={profileLoading}>{t('settings.saveChanges')}</Button>
                <Button variant="outline" onClick={() => setProfile(savedProfile)}>{t('common.cancel')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.changePassword')}</CardTitle>
                <CardDescription>{t('settings.updateAccessPassword')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('settings.currentPassword')} *</Label>
                  <div className="relative">
                    <Input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
                    <button type="button" onClick={() => setShowCurrentPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-label={t('settings.togglePasswordVisibility')}>
                      {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')} *</Label>
                  <div className="relative">
                    <Input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                    <button type="button" onClick={() => setShowNewPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" aria-label={t('settings.togglePasswordVisibility')}>
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600">{t('settings.passwordRequirementsFull')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmNewPassword')} *</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
                <Button onClick={handleChangePassword}>{t('settings.changePassword')}</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.activeSessions')}</CardTitle>
                <CardDescription>{t('settings.activeSessionsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Shield className="size-4" />
                  <AlertDescription>{t('settings.sessionsNotAvailable')}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.dataPrivacy')}</CardTitle>
              <CardDescription>{t('settings.dataPrivacyDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <Shield className="size-4" />
                <AlertDescription>{t('settings.privacyNotAvailable')}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <LanguageSelector />
            <VacationMode homeId={homeId} />
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.accountInfo')}</CardTitle>
              <CardDescription>{t('settings.accountInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><div className="text-sm text-gray-600">{t('settings.registrationDate')}</div><div className="text-sm">{formatDate(summary.createdAt)}</div></div>
              <div><div className="text-sm text-gray-600">{t('settings.accountType')}</div><Badge>{roleLabel}</Badge></div>
              <div><div className="text-sm text-gray-600">{t('settings.registeredHomes')}</div><div className="text-sm">{summary.homes ?? '—'}</div></div>
              <div><div className="text-sm text-gray-600">{t('settings.activeDevices')}</div><div className="text-sm">{summary.devices ?? '—'}</div></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

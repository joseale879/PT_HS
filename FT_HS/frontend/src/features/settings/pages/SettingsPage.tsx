import { useEffect, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/ui/tabs';
import {
  Camera,
  BellRing,
  Download,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  LogOut,
  Mail,
  Monitor,
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authApi } from '@features/auth/api/auth.api';
import { VacationMode } from '@features/vacation/pages/VacationPage';
import { useAuth } from '@app/providers/AuthProvider';
import {
  devicesApi,
  homesApi,
  privacyApi,
  type ArcoRequest,
  type NotificationSettings,
  userApi,
  type AuthSession as SessionRecord,
} from '@shared/http/apiClient';
import { LanguageSelector } from '@shared/ui/LanguageSelector';
import { toast } from 'sonner';
import {
  getPrimaryRole,
  roleBadgeClass,
  roleTranslationKey,
  type SystemRole,
} from '@shared/config/authorization';
import { Switch } from '@shared/ui/switch';

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

const defaultNotificationSettings: NotificationSettings = {
  notificationsEnabled: true,
  preferredChannel: 'Email',
  notificationPreferences: {
    consumption: { dailyReport: true, weeklyReport: true, monthlyReport: true },
    alerts: { leakDetection: true, abnormalConsumption: true, flowThresholdExceeded: true },
    devices: { deviceDisconnected: true, lowBattery: true },
    channels: { email: true, push: false },
  },
};

function normalizeNotificationSettings(value: Partial<NotificationSettings>): NotificationSettings {
  const groups = (value.notificationPreferences || {}) as Partial<
    NotificationSettings['notificationPreferences']
  >;
  return {
    notificationsEnabled: value.notificationsEnabled !== false,
    preferredChannel: value.preferredChannel || 'Email',
    notificationPreferences: {
      consumption: {
        ...defaultNotificationSettings.notificationPreferences.consumption,
        ...(groups.consumption || {}),
      },
      alerts: {
        ...defaultNotificationSettings.notificationPreferences.alerts,
        ...(groups.alerts || {}),
      },
      devices: {
        ...defaultNotificationSettings.notificationPreferences.devices,
        ...(groups.devices || {}),
      },
      channels: {
        ...defaultNotificationSettings.notificationPreferences.channels,
        ...(groups.channels || {}),
      },
    },
  };
}

function NotificationToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block font-medium">{label}</span>
        <span className="block text-sm text-gray-600">{description}</span>
      </label>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}

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
  const { refreshSession, logout } = useAuth();
  const primaryRole = getPrimaryRole(roles);
  const roleLabel = t(roleTranslationKey(primaryRole));
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);
  const [summary, setSummary] = useState<AccountSummary>({
    createdAt: null,
    homes: null,
    devices: null,
  });
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState(false);
  const [sessionActionId, setSessionActionId] = useState<string | null>(null);
  const [privacyRequests, setPrivacyRequests] = useState<ArcoRequest[]>([]);
  const [privacyRequestsLoading, setPrivacyRequestsLoading] = useState(true);
  const [privacyRequestType, setPrivacyRequestType] = useState('access');
  const [privacyRequestDescription, setPrivacyRequestDescription] = useState('');
  const [privacyActionLoading, setPrivacyActionLoading] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings
  );
  const [notificationSettingsLoading, setNotificationSettingsLoading] = useState(true);
  const [notificationSettingsSaving, setNotificationSettingsSaving] = useState(false);
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

  useEffect(() => {
    let active = true;
    userApi
      .notificationPreferences()
      .then(({ data }) => {
        if (active) setNotificationSettings(normalizeNotificationSettings(data));
      })
      .catch((error) => {
        if (active) {
          toast.error(error instanceof Error ? error.message : t('settings.profileLoadError'));
        }
      })
      .finally(() => {
        if (active) setNotificationSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    let active = true;
    authApi
      .listSessions()
      .then((response) => {
        if (!active) return;
        setSessions(response.data);
        setSessionsError(false);
      })
      .catch(() => {
        if (active) setSessionsError(true);
      })
      .finally(() => {
        if (active) setSessionsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    privacyApi
      .requests()
      .then((response) => {
        if (active) setPrivacyRequests(response.data);
      })
      .catch((error) => {
        if (active)
          toast.error(error instanceof Error ? error.message : t('settings.privacyRequestsError'));
      })
      .finally(() => {
        if (active) setPrivacyRequestsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [t]);

  const handleSaveProfile = async () => {
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
      toast.error(t('settings.photoInvalidType'));
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t('settings.photoTooLarge'));
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setProfile((current) => ({ ...current, avatarDataUrl: String(reader.result) }));
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

  const reloadSessions = async () => {
    const response = await authApi.listSessions();
    setSessions(response.data);
    setSessionsError(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessionActionId(sessionId);
    try {
      await authApi.revokeSession(sessionId);
      await reloadSessions();
      toast.success(t('settings.sessionClosed'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.sessionActionError'));
    } finally {
      setSessionActionId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setSessionActionId('others');
    try {
      const response = await authApi.revokeOtherSessions();
      await reloadSessions();
      toast.success(t('settings.sessionsClosed'), {
        description: t('settings.sessionsClosedCount', { count: response.data.revokedCount }),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.sessionActionError'));
    } finally {
      setSessionActionId(null);
    }
  };

  const handleRevokeAll = async () => {
    setSessionActionId('all');
    try {
      await authApi.revokeAllSessions();
      toast.success(t('settings.allSessionsClosed'));
      await logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.sessionActionError'));
    } finally {
      setSessionActionId(null);
    }
  };

  const handleExportData = async () => {
    setPrivacyActionLoading(true);
    try {
      const payload = await privacyApi.exportData();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hidro-smart-data-export.json';
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('settings.exportCompleted'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.exportError'));
    } finally {
      setPrivacyActionLoading(false);
    }
  };

  const handleCreatePrivacyRequest = async () => {
    if (privacyRequestDescription.trim().length < 3) {
      toast.error(t('settings.privacyDescriptionRequired'));
      return;
    }
    setPrivacyActionLoading(true);
    try {
      const response = await privacyApi.createRequest({
        type: privacyRequestType,
        description: privacyRequestDescription.trim(),
      });
      setPrivacyRequests((current) => [response.data, ...current]);
      setPrivacyRequestDescription('');
      toast.success(t('settings.privacyRequestCreated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.privacyRequestError'));
    } finally {
      setPrivacyActionLoading(false);
    }
  };

  const updateNotificationGroup = (
    group: keyof NotificationSettings['notificationPreferences'],
    key: string,
    checked: boolean
  ) => {
    setNotificationSettings((current) => ({
      ...current,
      notificationPreferences: {
        ...current.notificationPreferences,
        [group]: {
          ...current.notificationPreferences[group],
          [key]: checked,
        },
      },
    }));
  };

  const handleSaveNotificationSettings = async () => {
    setNotificationSettingsSaving(true);
    try {
      const response = await userApi.updateNotificationPreferences(notificationSettings);
      setNotificationSettings(normalizeNotificationSettings(response.data));
      toast.success(t('settings.changesSaved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('settings.profileSaveError'));
    } finally {
      setNotificationSettingsSaving(false);
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
        <TabsList className="!grid !w-full grid-cols-2 mobile-equal-tabs sm:!grid sm:grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="profile">{t('settings.profile')}</TabsTrigger>
          <TabsTrigger value="security">{t('settings.security')}</TabsTrigger>
          <TabsTrigger value="privacy">{t('settings.privacy')}</TabsTrigger>
          <TabsTrigger value="preferences">{t('settings.preferences')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('notifications.title')}</TabsTrigger>
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
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-2xl text-white">
                  {profile.avatarDataUrl ? (
                    <img
                      src={profile.avatarDataUrl}
                      alt={t('settings.profilePhotoAlt')}
                      className="size-full object-cover"
                    />
                  ) : (
                    profile.fullName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase() || 'HS'
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={profileLoading}
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Camera className="size-4" />
                    {t('settings.changePhoto')}
                  </Button>
                  <p className="text-xs text-gray-600">{t('settings.photoFormats')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="space-y-2">
                  <Label htmlFor="docType">{t('settings.documentType')} *</Label>
                  <Select value={profile.documentType || undefined} disabled>
                    <SelectTrigger id="docType">
                      <SelectValue placeholder="—" />
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
                    maxLength={60}
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

              <Alert>
                <Shield className="size-4" />
                <AlertDescription>
                  {t('settings.sensitiveChangesRequireEmailVerification')}
                </AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <Button onClick={handleSaveProfile} disabled={profileLoading}>
                  {t('settings.saveChanges')}
                </Button>
                <Button variant="outline" onClick={() => setProfile(savedProfile)}>
                  {t('common.cancel')}
                </Button>
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
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      aria-label={t('settings.togglePasswordVisibility')}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('settings.newPassword')} *</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      aria-label={t('settings.togglePasswordVisibility')}
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
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
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
                {sessionsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="size-4 animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : sessionsError ? (
                  <Alert variant="destructive">
                    <Shield className="size-4" />
                    <AlertDescription>{t('settings.sessionsLoadError')}</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {sessions.length ? (
                        sessions.map((session) => (
                          <div
                            key={session.sessionId}
                            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-start gap-3">
                              <Monitor className="mt-1 size-5 shrink-0 text-gray-500" />
                              <div className="min-w-0">
                                <p className="font-medium">
                                  {session.isCurrent
                                    ? t('settings.thisDevice')
                                    : t('settings.otherDevice')}
                                  {session.isCurrent ? ` · ${t('settings.activeNow')}` : ''}
                                </p>
                                <p className="truncate text-sm text-gray-600">
                                  {session.userAgent || t('settings.unknownDevice')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t('settings.sessionStarted', {
                                    date: new Intl.DateTimeFormat(i18n.language, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    }).format(new Date(session.startedAt)),
                                  })}
                                </p>
                              </div>
                            </div>
                            {!session.isCurrent && session.status === 'Active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={sessionActionId !== null}
                                onClick={() => handleRevokeSession(session.sessionId)}
                              >
                                {sessionActionId === session.sessionId && (
                                  <Loader2 className="size-4 animate-spin" />
                                )}
                                {t('settings.closeSession')}
                              </Button>
                            ) : (
                              <Badge variant="secondary">
                                {session.status === 'Active'
                                  ? t('settings.currentSession')
                                  : t('settings.closedSession')}
                              </Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">{t('settings.noSessions')}</p>
                      )}
                    </div>
                    <Alert>
                      <Shield className="size-4" />
                      <AlertDescription>{t('settings.jwtSessionsNotice')}</AlertDescription>
                    </Alert>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        disabled={
                          sessionActionId !== null ||
                          !sessions.some(
                            (session) => !session.isCurrent && session.status === 'Active'
                          )
                        }
                        onClick={handleRevokeOthers}
                      >
                        {sessionActionId === 'others' && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        {t('settings.closeOtherSessions')}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={sessionActionId !== null || !sessions.length}
                        onClick={handleRevokeAll}
                      >
                        {sessionActionId === 'all' ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                        {t('settings.closeAllSessions')}
                      </Button>
                    </div>
                  </div>
                )}
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
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="size-4" />
                <AlertDescription>{t('settings.privacyAvailable')}</AlertDescription>
              </Alert>

              <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">{t('settings.exportData')}</div>
                  <div className="text-sm text-gray-600">{t('settings.exportDataDesc')}</div>
                </div>
                <Button onClick={handleExportData} disabled={privacyActionLoading}>
                  {privacyActionLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Download className="size-4" />
                  )}
                  {t('settings.downloadExport')}
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="size-4" />
                  {t('settings.privacyRequestTitle')}
                </div>
                <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="privacy-request-type">{t('settings.privacyRequestType')}</Label>
                    <select
                      id="privacy-request-type"
                      className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={privacyRequestType}
                      onChange={(event) => setPrivacyRequestType(event.target.value)}
                    >
                      <option value="access">{t('settings.privacyAccess')}</option>
                      <option value="rectification">{t('settings.privacyRectification')}</option>
                      <option value="cancellation">{t('settings.privacyCancellation')}</option>
                      <option value="opposition">{t('settings.privacyOpposition')}</option>
                      <option value="portability">{t('settings.privacyPortability')}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privacy-request-description">
                      {t('settings.privacyRequestDescription')}
                    </Label>
                    <textarea
                      id="privacy-request-description"
                      className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      maxLength={5000}
                      value={privacyRequestDescription}
                      onChange={(event) => setPrivacyRequestDescription(event.target.value)}
                      placeholder={t('settings.privacyRequestPlaceholder')}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleCreatePrivacyRequest}
                  disabled={privacyActionLoading}
                >
                  {t('settings.submitPrivacyRequest')}
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">{t('settings.privacyRequestsTitle')}</h3>
                {privacyRequestsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="size-4 animate-spin" />
                    {t('settings.loading')}
                  </div>
                ) : privacyRequests.length === 0 ? (
                  <p className="text-sm text-gray-600">{t('settings.privacyRequestsEmpty')}</p>
                ) : (
                  <div className="space-y-2">
                    {privacyRequests.map((request) => (
                      <div key={request.requestId} className="rounded-md border p-3 text-sm">
                        <div className="flex flex-wrap justify-between gap-2">
                          <span className="font-medium">{request.type}</span>
                          <Badge variant="outline">{request.status}</Badge>
                        </div>
                        <p className="mt-1 text-gray-600">{request.description || '—'}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {t('settings.privacyDeadline', { date: formatDate(request.deadlineAt) })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <div className="space-y-6">
            <LanguageSelector />
            <VacationMode homeId={homeId} />
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>
                <BellRing className="mr-2 inline size-5" />
                {t('notifications.settings')}
              </CardTitle>
              <CardDescription>{t('notifications.settingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between gap-4 rounded-lg border bg-blue-50 p-4">
                <div>
                  <p className="font-medium">{t('notifications.title')}</p>
                  <p className="text-sm text-gray-600">{t('notifications.settingsDesc')}</p>
                </div>
                <Switch
                  checked={notificationSettings.notificationsEnabled}
                  disabled={notificationSettingsLoading || notificationSettingsSaving}
                  onCheckedChange={(checked) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      notificationsEnabled: checked,
                    }))
                  }
                  aria-label={t('notifications.title')}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <BellRing className="size-4" />
                  {t('notifications.consumptionNotifications')}
                </div>
                <div className="rounded-lg border px-4">
                  <NotificationToggle
                    id="notification-daily-report"
                    label={t('notifications.dailyConsumptionReport')}
                    description={t('notifications.dailyConsumptionReportDesc')}
                    checked={notificationSettings.notificationPreferences.consumption.dailyReport}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('consumption', 'dailyReport', checked)
                    }
                  />
                  <NotificationToggle
                    id="notification-weekly-report"
                    label={t('notifications.weeklyReport')}
                    description={t('notifications.weeklyReportDesc')}
                    checked={notificationSettings.notificationPreferences.consumption.weeklyReport}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('consumption', 'weeklyReport', checked)
                    }
                  />
                  <NotificationToggle
                    id="notification-monthly-report"
                    label={t('notifications.monthlyReport')}
                    description={t('notifications.monthlyReportDesc')}
                    checked={notificationSettings.notificationPreferences.consumption.monthlyReport}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('consumption', 'monthlyReport', checked)
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <BellRing className="size-4" />
                  {t('notifications.criticalAlerts')}
                </div>
                <div className="rounded-lg border px-4">
                  <NotificationToggle
                    id="notification-leak-detection"
                    label={t('notifications.leakDetection')}
                    description={t('notifications.leakDetectionDesc')}
                    checked={notificationSettings.notificationPreferences.alerts.leakDetection}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('alerts', 'leakDetection', checked)
                    }
                  />
                  <NotificationToggle
                    id="notification-abnormal-consumption"
                    label={t('notifications.abnormalConsumption')}
                    description={t('notifications.abnormalConsumptionDesc')}
                    checked={
                      notificationSettings.notificationPreferences.alerts.abnormalConsumption
                    }
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('alerts', 'abnormalConsumption', checked)
                    }
                  />
                  <NotificationToggle
                    id="notification-flow-threshold"
                    label={t('notifications.flowThresholdExceeded')}
                    description={t('notifications.flowThresholdExceededDesc')}
                    checked={
                      notificationSettings.notificationPreferences.alerts.flowThresholdExceeded
                    }
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('alerts', 'flowThresholdExceeded', checked)
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <BellRing className="size-4" />
                  {t('notifications.deviceStatus')}
                </div>
                <div className="rounded-lg border px-4">
                  <NotificationToggle
                    id="notification-device-disconnected"
                    label={t('notifications.deviceDisconnected')}
                    description={t('notifications.deviceDisconnectedDesc')}
                    checked={
                      notificationSettings.notificationPreferences.devices.deviceDisconnected
                    }
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('devices', 'deviceDisconnected', checked)
                    }
                  />
                  <NotificationToggle
                    id="notification-low-battery"
                    label={t('notifications.lowBattery')}
                    description={t('notifications.lowBatteryDesc')}
                    checked={notificationSettings.notificationPreferences.devices.lowBattery}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('devices', 'lowBattery', checked)
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Mail className="size-4" />
                  {t('notifications.notificationChannels')}
                </div>
                <div className="rounded-lg border px-4">
                  <NotificationToggle
                    id="notification-email"
                    label={`${t('notifications.email')} (Gmail)`}
                    description={t('notifications.emailDesc')}
                    checked={notificationSettings.notificationPreferences.channels.email}
                    disabled={
                      notificationSettingsLoading ||
                      notificationSettingsSaving ||
                      !notificationSettings.notificationsEnabled
                    }
                    onCheckedChange={(checked) =>
                      updateNotificationGroup('channels', 'email', checked)
                    }
                  />
                  <div className="flex items-center justify-between gap-4 border-b py-3 last:border-b-0">
                    <div>
                      <p className="font-medium">{t('notifications.pushNotifications')}</p>
                      <p className="text-sm text-gray-600">
                        {t('notifications.pushNotificationsDesc')}
                      </p>
                    </div>
                    <Badge variant="outline">{t('common.inDevelopment')}</Badge>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveNotificationSettings}
                disabled={notificationSettingsLoading || notificationSettingsSaving}
              >
                {notificationSettingsSaving && <Loader2 className="size-4 animate-spin" />}
                {t('settings.saveChanges')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.accountInfo')}</CardTitle>
              <CardDescription>{t('settings.accountInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-sm text-gray-600">{t('settings.registrationDate')}</div>
                <div className="text-sm">{formatDate(summary.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('settings.accountType')}</div>
                <Badge>{roleLabel}</Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('settings.registeredHomes')}</div>
                <div className="text-sm">{summary.homes ?? '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('settings.activeDevices')}</div>
                <div className="text-sm">{summary.devices ?? '—'}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ShieldCheck, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@shared/ui/alert';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';
import { rolesApi, userApi, type ManagedUser } from '@shared/http/apiClient';
import { roleTranslationKey, type SystemRole } from '@shared/config/authorization';
import { toast } from 'sonner';

type AccountStatus = 'Active' | 'Suspended' | 'Blocked';

const statusStyles: Record<AccountStatus, string> = {
  Active: 'bg-green-100 text-green-800',
  Suspended: 'bg-yellow-100 text-yellow-800',
  Blocked: 'bg-red-100 text-red-800',
};

const MANAGED_ROLES: SystemRole[] = ['Administrator', 'Support', 'HomeUser', 'Guest'];

export function UserManagementPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<AccountStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [roleActionId, setRoleActionId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.listManagedUsers({
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
        page,
        pageSize: 20,
        sort: 'createdAt',
        order: 'desc',
      });
      setUsers(response.data);
      setPagination(response.pagination);
      setError(false);
    } catch (requestError) {
      setError(true);
      toast.error(requestError instanceof Error ? requestError.message : t('admin.usersLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [page, status, search]);

  const handleStatusChange = async (user: ManagedUser, nextStatus: AccountStatus) => {
    const reason = reasons[user.userId]?.trim();
    if (nextStatus !== 'Active' && !reason) {
      toast.error(t('admin.reasonRequired'));
      return;
    }
    setActionId(user.userId);
    try {
      await userApi.changeUserStatus(user.userId, nextStatus, reason);
      toast.success(t('admin.userStatusUpdated'));
      await loadUsers();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error ? requestError.message : t('admin.userActionError')
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    if (!window.confirm(t('admin.deleteUserConfirmation', { user: user.fullName || user.email })))
      return;
    setActionId(user.userId);
    try {
      await userApi.deleteUser(user.userId);
      toast.success(t('admin.userDeleted'));
      if (page > 1 && users.length === 1) setPage((current) => current - 1);
      else await loadUsers();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error ? requestError.message : t('admin.userActionError')
      );
    } finally {
      setActionId(null);
    }
  };

  const handleRoleToggle = async (user: ManagedUser, roleName: SystemRole) => {
    const assigned = user.roles.some((role) => role.toLowerCase() === roleName.toLowerCase());
    const requestId = `${user.userId}:${roleName}`;
    setRoleActionId(requestId);
    try {
      if (assigned) await rolesApi.remove(user.userId, roleName);
      else await rolesApi.assign(user.userId, { roleName });
      toast.success(assigned ? t('admin.roleRemoved') : t('admin.roleAssigned'));
      await loadUsers();
    } catch (requestError) {
      toast.error(
        requestError instanceof Error ? requestError.message : t('admin.roleActionError')
      );
    } finally {
      setRoleActionId(null);
    }
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5" />
          {t('admin.userManagement')}
        </CardTitle>
        <CardDescription>{t('admin.userManagementDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <div className="space-y-2">
            <Label htmlFor="user-search">{t('admin.searchUsers')}</Label>
            <Input
              id="user-search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t('admin.searchUsersPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-status-filter">{t('admin.filterStatus')}</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as AccountStatus | 'all');
                setPage(1);
              }}
            >
              <SelectTrigger id="user-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatuses')}</SelectItem>
                <SelectItem value="Active">{t('admin.statusActive')}</SelectItem>
                <SelectItem value="Suspended">{t('admin.statusSuspended')}</SelectItem>
                <SelectItem value="Blocked">{t('admin.statusBlocked')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{t('admin.usersLoadError')}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-gray-600">
            <Loader2 className="size-4 animate-spin" /> {t('common.loading')}
          </div>
        ) : users.length ? (
          <div className="space-y-3">
            {users.map((user) => {
              const userStatus = (
                user.status in statusStyles ? user.status : 'Blocked'
              ) as AccountStatus;
              return (
                <div key={user.userId} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{user.fullName || user.username}</p>
                        <Badge className={statusStyles[userStatus]}>
                          {t(`admin.status${userStatus}`)}
                        </Badge>
                      </div>
                      <p className="truncate text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">
                        {user.roles.join(', ') || t('admin.noRoles')} · {formatDate(user.createdAt)}
                      </p>
                    </div>
                    <div className="grid gap-2 lg:min-w-[34rem]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-gray-600">
                          {t('admin.roleManagement')}:
                        </span>
                        {MANAGED_ROLES.map((role) => {
                          const assigned = user.roles.some(
                            (currentRole) => currentRole.toLowerCase() === role.toLowerCase()
                          );
                          const currentRoleActionId = `${user.userId}:${role}`;
                          return (
                            <Button
                              key={role}
                              type="button"
                              size="sm"
                              variant={assigned ? 'default' : 'outline'}
                              disabled={actionId !== null || roleActionId !== null}
                              onClick={() => void handleRoleToggle(user, role)}
                              aria-label={`${assigned ? t('admin.removeRole') : t('admin.addRole')}: ${t(roleTranslationKey(role))}`}
                            >
                              {roleActionId === currentRoleActionId ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                              ) : (
                                <ShieldCheck className="mr-1 size-3" />
                              )}
                              {t(roleTranslationKey(role))}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
                        <Select
                          value={userStatus}
                          disabled={actionId !== null || roleActionId !== null}
                          onValueChange={(value) =>
                            void handleStatusChange(user, value as AccountStatus)
                          }
                        >
                          <SelectTrigger aria-label={t('admin.changeStatus')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">{t('admin.statusActive')}</SelectItem>
                            <SelectItem value="Suspended">{t('admin.statusSuspended')}</SelectItem>
                            <SelectItem value="Blocked">{t('admin.statusBlocked')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={reasons[user.userId] || ''}
                          disabled={actionId !== null || roleActionId !== null}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [user.userId]: event.target.value,
                            }))
                          }
                          placeholder={t('admin.reasonPlaceholder')}
                          aria-label={t('admin.reasonPlaceholder')}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          disabled={actionId !== null || roleActionId !== null}
                          onClick={() => void handleDelete(user)}
                          aria-label={t('admin.deleteUser')}
                          title={t('admin.deleteUser')}
                        >
                          {actionId === user.userId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-600">{t('admin.noUsers')}</p>
        )}

        <div className="flex flex-col gap-3 border-t pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>{t('admin.totalUsers', { count: pagination.total })}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              aria-label={t('admin.previousPage')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span>
              {pagination.page} / {Math.max(pagination.totalPages, 1)}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              aria-label={t('admin.nextPage')}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

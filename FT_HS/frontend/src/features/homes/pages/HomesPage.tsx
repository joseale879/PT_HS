import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@shared/ui/dialog';
import { Badge } from '@shared/ui/badge';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  UserPlus,
} from 'lucide-react';
import { homesApi } from '@shared/http/httpClient';
import { toast } from 'sonner';
import { MembershipRequestsPanel } from '../ui/MembershipRequestsPanel';
import { can } from '@shared/config/authorization';

type Home = {
  homeId: string;
  name: string;
  address: string;
  city: string;
  tier?: number | null;
  status?: string;
};
type Member = {
  userId: string;
  fullName?: string;
  username?: string;
  email?: string;
  homeRole?: string;
};

export function HomeManagement({ permissions = [] }: { permissions?: string[] }) {
  const { t } = useTranslation();
  const canManage = can(permissions, 'homes.manage');
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [newHomeOpen, setNewHomeOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const homesCarouselRef = useRef<HTMLDivElement>(null);

  const scrollHomes = (direction: 'previous' | 'next') => {
    homesCarouselRef.current?.scrollBy({
      left: (direction === 'next' ? 1 : -1) * homesCarouselRef.current.clientWidth * 0.85,
      behavior: 'smooth',
    });
  };

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await homesApi.list();
      const loaded = data as Home[];
      setHomes(loaded);
      setSelectedHome(
        (current) => loaded.find((home) => home.homeId === current?.homeId) || loaded[0] || null
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : t('homes.loadError');
      setLoadError(message);
      setHomes([]);
      setSelectedHome(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const loadMembers = async (homeId: string) => {
    setMembersLoading(true);
    setMembersError(null);
    try {
      const { data } = await homesApi.members(homeId);
      setMembers(data as Member[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('homes.membersLoadError');
      setMembersError(message);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (selectedHome) {
      void loadMembers(selectedHome.homeId);
    } else {
      setMembers([]);
      setMembersError(null);
    }
  }, [selectedHome]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await homesApi.create({
        name: String(form.get('name')),
        address: String(form.get('address')),
        city: String(form.get('city')),
        tier: String(form.get('tier') || '') || null,
      });
      toast.success(t('homes.created'));
      setNewHomeOpen(false);
      event.currentTarget.reset();
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('homes.createError'));
    }
  };

  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHome) return;
    const form = new FormData(event.currentTarget);
    try {
      const result = await homesApi.addMember(selectedHome.homeId, {
        email: String(form.get('email')),
        homeRole: String(form.get('role')) as 'Owner' | 'Member' | 'Guest',
      });
      if (result.notification?.sent) {
        toast.success(t('homes.memberAddedEmailSent'));
      } else if (result.notification) {
        toast.warning(t('homes.memberAddedEmailPending'));
      } else {
        toast.success(t('homes.memberAdded'));
      }
      setMemberOpen(false);
      event.currentTarget.reset();
      await loadMembers(selectedHome.homeId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('homes.addMemberError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">{t('homes.title')}</h2>
          <p className="text-gray-600">{t('homes.subtitle')}</p>
        </div>
        {canManage && (
          <Dialog open={newHomeOpen} onOpenChange={setNewHomeOpen}>
            <DialogTrigger asChild>
              <Button disabled={loading}>
                <Plus className="mr-2 size-4" />
                {t('homes.registerNewHome')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={create}>
                <DialogHeader>
                  <DialogTitle>{t('homes.createTitle')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input name="name" placeholder={t('homes.homeNamePlaceholder')} required />
                  <Input name="address" placeholder={t('homes.addressPlaceholder')} required />
                  <Input name="city" placeholder={t('homes.cityPlaceholder')} required />
                  <Input
                    name="tier"
                    type="number"
                    min="1"
                    max="6"
                    placeholder={t('homes.selectStratum')}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{t('common.save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center rounded-lg border bg-white text-sm text-gray-600">
          <Loader2 className="mr-2 size-5 animate-spin" />
          {t('common.loading')}
        </div>
      ) : loadError ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            {t('common.retry')}
          </Button>
        </div>
      ) : homes.length ? (
        <div className="space-y-2">
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scrollHomes('previous')}
              disabled={homes.length < 2}
              aria-label={t('homes.previousHome')}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => scrollHomes('next')}
              disabled={homes.length < 2}
              aria-label={t('homes.nextHome')}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div
            ref={homesCarouselRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:thin]"
            aria-label={t('homes.title')}
          >
            {homes.map((home) => (
              <Card
                key={home.homeId}
                className={`w-[calc(100%-0.5rem)] shrink-0 snap-start sm:w-[calc(50%-0.75rem)] ${
                  selectedHome?.homeId === home.homeId ? 'border-blue-600' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle>
                    <Building2 className="mr-2 inline size-5 text-blue-600" />
                    {home.name}
                  </CardTitle>
                  <CardDescription>
                    {home.address} · {home.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <Badge>{home.status || t('homes.active')}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedHome(home)}>
                    {t('homes.viewMembers')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-gray-600">{t('homes.noHomes')}</p>
          <p className="mt-2 text-sm text-gray-500">{t('homes.createFirst')}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{t('homes.homeMembers')}</CardTitle>
              <CardDescription>
                {selectedHome?.name || t('homes.selectHomeForMembers')}
              </CardDescription>
            </div>
            {selectedHome && canManage && (
              <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                <DialogTrigger asChild>
                  <Button disabled={membersLoading}>
                    <UserPlus className="mr-2 size-4" />
                    {t('homes.addMember')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={addMember}>
                    <DialogHeader>
                      <DialogTitle>{t('homes.addMemberTitle')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        name="email"
                        type="email"
                        placeholder={t('homes.memberEmailPlaceholder')}
                        required
                      />
                      <select
                        name="role"
                        className="h-10 w-full rounded-md border px-3"
                        defaultValue="Member"
                      >
                        <option value="Member">{t('homes.member')}</option>
                        <option value="Guest">{t('roles.guest')}</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="submit">{t('homes.addMemberButton')}</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {membersLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-gray-600">
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t('common.loading')}
            </div>
          ) : membersError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
              <p className="text-sm text-red-700">{membersError}</p>
              {selectedHome && (
                <Button variant="outline" onClick={() => void loadMembers(selectedHome.homeId)}>
                  <RefreshCw className="mr-2 size-4" />
                  {t('common.retry')}
                </Button>
              )}
            </div>
          ) : members.length ? (
            members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">
                    {member.fullName || member.username || member.email}
                  </p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
                <Badge variant="outline">{member.homeRole}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {selectedHome ? t('homes.noMembersInHome') : t('homes.selectHomeForMembers')}
            </p>
          )}
        </CardContent>
      </Card>
      {canManage && <MembershipRequestsPanel />}
    </div>
  );
}

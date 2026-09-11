import { useEffect, useState } from 'react';
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
import { Building2, Plus, UserPlus } from 'lucide-react';
import { homesApi } from '@shared/http/httpClient';
import { isValidEmail } from '@shared/lib/validators';
import { toast } from 'sonner';
import { MembershipRequestsPanel } from '../ui/MembershipRequestsPanel';

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

export function HomeManagement() {
  const [homes, setHomes] = useState<Home[]>([]);
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newHomeOpen, setNewHomeOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const load = () =>
    homesApi
      .list()
      .then(({ data }) => {
        const loaded = data as Home[];
        setHomes(loaded);
        setSelectedHome(
          (current) => loaded.find((home) => home.homeId === current?.homeId) || loaded[0] || null
        );
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los hogares')
      );
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (selectedHome)
      homesApi
        .members(selectedHome.homeId)
        .then(({ data }) => setMembers(data as Member[]))
        .catch((error) =>
          toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los miembros')
        );
  }, [selectedHome]);
  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await homesApi.create({
        name: String(form.get('name')),
        address: String(form.get('address')),
        city: String(form.get('city')),
        tier: String(form.get('tier') || '') || null,
      });
      toast.success('Hogar creado');
      setNewHomeOpen(false);
      event.currentTarget.reset();
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo crear el hogar');
    }
  };
  const addMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedHome) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    if (!isValidEmail(email)) {
      toast.error('Ingresa un correo completo, por ejemplo: usuario@gmail.com');
      return;
    }
    try {
      await homesApi.addMember(selectedHome.homeId, {
        email,
        homeRole: String(form.get('role')) as 'Owner' | 'Member' | 'Guest',
      });
      toast.success('Miembro agregado');
      setMemberOpen(false);
      event.currentTarget.reset();
      const response = await homesApi.members(selectedHome.homeId);
      setMembers(response.data as Member[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo agregar el miembro');
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Hogares</h2>
          <p className="text-gray-600">Hogares y miembros consultados desde la base de datos.</p>
        </div>
        <Dialog open={newHomeOpen} onOpenChange={setNewHomeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 size-4" />
              Nuevo hogar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={create}>
              <DialogHeader>
                <DialogTitle>Crear hogar</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input name="name" placeholder="Nombre" required />
                <Input name="address" placeholder="Dirección" required />
                <Input name="city" placeholder="Ciudad" required />
                <Input name="tier" type="number" min="1" max="6" placeholder="Estrato" />
              </div>
              <DialogFooter>
                <Button type="submit">Guardar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {homes.map((home) => (
          <Card
            key={home.homeId}
            className={selectedHome?.homeId === home.homeId ? 'border-blue-600' : ''}
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
              <Badge>{home.status || 'Activo'}</Badge>
              <Button variant="outline" size="sm" onClick={() => setSelectedHome(home)}>
                Ver miembros
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Miembros</CardTitle>
              <CardDescription>{selectedHome?.name || 'Selecciona un hogar'}</CardDescription>
            </div>
            {selectedHome && (
              <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 size-4" />
                    Agregar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={addMember}>
                    <DialogHeader>
                      <DialogTitle>Agregar miembro</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        name="email"
                        type="email"
                        placeholder="Correo electrónico"
                        maxLength={150}
                        autoComplete="email"
                        required
                      />
                      <select
                        name="role"
                        className="h-10 w-full rounded-md border px-3"
                        defaultValue="Member"
                      >
                        <option value="Member">Miembro</option>
                        <option value="Guest">Invitado</option>
                      </select>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Agregar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {members.length ? (
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
            <p className="text-sm text-gray-500">No hay miembros para mostrar.</p>
          )}
        </CardContent>
      </Card>
      <MembershipRequestsPanel />
    </div>
  );
}

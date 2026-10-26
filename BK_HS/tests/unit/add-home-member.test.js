const test = require('node:test');
const assert = require('node:assert/strict');
const { AddHomeMember } = require('../../src/core/application/use-cases/home/AddHomeMember');

const homeId = '123e4567-e89b-12d3-a456-426614174000';

test('valida el email y el rol del hogar', async () => {
  const useCase = new AddHomeMember({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, email: 'bad', homeRole: 'Owner' }), { status: 400 });
});

test('agrega un miembro activo encontrado por el repositorio', async () => {
  const member = { user_id: 'user-2', email: 'member@example.com', home_role: 'Member' };
  const sent = [];
  const useCase = new AddHomeMember({
    homeRepository: {
      addMemberForOwner: async (input) => {
        assert.equal(input.email, 'member@example.com');
        return member;
      },
      findByIdForUser: async () => ({ name: 'Casa Principal' })
    },
    notificationService: {
      isConfigured: () => true,
      sendHomeAccessGranted: async (input) => sent.push(input)
    }
  });
  const result = await useCase.execute({ userId: 'user-1', homeId, email: 'Member@Example.com', homeRole: 'Member' });
  assert.deepEqual(result.member, member);
  assert.deepEqual(result.notification, { sent: true, configured: true });
  assert.deepEqual(sent, [{ recipient: 'member@example.com', name: undefined, homeName: 'Casa Principal', homeRole: 'Member' }]);
});

test('devuelve 404 si no existe un usuario activo', async () => {
  const useCase = new AddHomeMember({ homeRepository: { addMemberForOwner: async () => null } });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, email: 'missing@example.com', homeRole: 'Guest' }), { status: 404 });
});

test('no revierte el alta si el correo no está configurado o falla', async () => {
  const member = { user_id: 'user-2', email: 'member@example.com', home_role: 'Guest' };
  const useCase = new AddHomeMember({
    homeRepository: { addMemberForOwner: async () => member },
    notificationService: {
      isConfigured: () => true,
      sendHomeAccessGranted: async () => { throw new Error('SMTP no disponible'); }
    },
    logger: { error: () => {} }
  });

  const result = await useCase.execute({ userId: 'user-1', homeId, email: 'member@example.com', homeRole: 'Guest' });
  assert.deepEqual(result.member, member);
  assert.deepEqual(result.notification, { sent: false, configured: true });
});

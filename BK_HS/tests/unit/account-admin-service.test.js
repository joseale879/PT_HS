const test = require('node:test');
const assert = require('node:assert/strict');
const { AccountAdminService } = require('../../src/core/application/services/user/AccountAdminService');

const actorId = '123e4567-e89b-12d3-a456-426614174000';
const targetUserId = '123e4567-e89b-12d3-a456-426614174001';

test('suspende una cuenta con motivo y delega al repositorio', async () => {
  const calls = [];
  const service = new AccountAdminService({
    userRepository: {
      changeAccountStatus: async (input) => { calls.push(input); return { userId: targetUserId, status: 'Suspended' }; }
    }
  });

  const result = await service.changeStatus({ actorId, targetUserId, status: 'Suspended', reason: 'Actividad sospechosa' });
  assert.equal(result.status, 'Suspended');
  assert.deepEqual(calls, [{ actorId, targetUserId, status: 'Suspended', reason: 'Actividad sospechosa' }]);
});

test('valida estado, motivo e impide afectar la propia cuenta', async () => {
  const service = new AccountAdminService({ userRepository: {} });

  await assert.rejects(() => service.changeStatus({ actorId, targetUserId, status: 'Unknown', reason: 'x' }), (error) => error.status === 400);
  await assert.rejects(() => service.changeStatus({ actorId, targetUserId, status: 'Suspended', reason: 'x' }), (error) => error.status === 400);
  await assert.rejects(() => service.changeStatus({ actorId, targetUserId: actorId, status: 'Active' }), (error) => error.status === 400);
});

test('elimina lógicamente una cuenta y traduce ausencia a 404', async () => {
  let called = false;
  const service = new AccountAdminService({
    userRepository: { deleteAccount: async () => { called = true; return true; } }
  });

  await service.deleteAccount({ actorId, targetUserId });
  assert.equal(called, true);
  const missing = new AccountAdminService({ userRepository: { deleteAccount: async () => false } });
  await assert.rejects(() => missing.deleteAccount({ actorId, targetUserId }), (error) => error.status === 404);
});

test('lista usuarios con paginación y filtros validados', async () => {
  const calls = [];
  const service = new AccountAdminService({
    userRepository: {
      listManagedUsers: async (input) => { calls.push(input); return { items: [{ userId: targetUserId }], total: 1 }; }
    }
  });

  const result = await service.listUsers({ actorId, search: 'ana', status: 'Active', sort: 'email', order: 'asc', page: 2, pageSize: 10 });
  assert.deepEqual(result.pagination, { page: 2, pageSize: 10, total: 1, totalPages: 1 });
  assert.deepEqual(calls, [{ actorId, search: 'ana', status: 'Active', sort: 'email', order: 'asc', limit: 10, offset: 10 }]);
  await assert.rejects(() => service.listUsers({ actorId, page: 0 }), (error) => error.status === 400);
});

test('no revierte el cambio de estado si falla la notificación', async () => {
  let changed = false;
  const service = new AccountAdminService({
    userRepository: {
      findById: async () => ({ email: 'user@example.com', fullName: 'Usuario' }),
      changeAccountStatus: async () => { changed = true; return { userId: targetUserId, status: 'Suspended' }; }
    },
    notificationService: {
      isConfigured: () => true,
      sendAccountSuspended: async () => { throw new Error('SMTP no disponible'); }
    },
    logger: { error: () => {} }
  });

  await service.changeStatus({ actorId, targetUserId, status: 'Suspended', reason: 'Prueba' });
  assert.equal(changed, true);
});

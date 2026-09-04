const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ListUserRoles,
  AssignUserRole,
  RemoveUserRole,
} = require('../../src/core/application/use-cases/role/RoleOperations');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';
const targetUserId = '6eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('lista los roles del usuario objetivo', async () => {
  const calls = [];
  const repository = {
    listUserRoles: async (input) => { calls.push(input); return [{ roleName: 'HomeUser' }]; },
  };

  const result = await new ListUserRoles({ repository }).execute({ userId, targetUserId });

  assert.deepEqual(result, [{ roleName: 'HomeUser' }]);
  assert.deepEqual(calls, [{ userId, targetUserId }]);
});

test('normaliza el nombre al asignar un rol', async () => {
  let received;
  const repository = {
    assign: async (input) => { received = input; return { roleName: 'Support' }; },
  };

  await new AssignUserRole({ repository }).execute({ userId, targetUserId, roleName: ' Support ' });

  assert.deepEqual(received, { userId, targetUserId, roleName: 'Support' });
});

test('retira un rol mediante el repositorio', async () => {
  let received;
  const repository = {
    remove: async (input) => { received = input; return true; },
  };

  await new RemoveUserRole({ repository }).execute({ userId, targetUserId, roleName: 'Guest' });

  assert.deepEqual(received, { userId, targetUserId, roleName: 'Guest' });
});

test('rechaza identificadores y nombres de rol inválidos', async () => {
  const repository = { assign: async () => null };
  const useCase = new AssignUserRole({ repository });

  assert.throws(
    () => useCase.execute({ userId, targetUserId: 'invalid', roleName: 'Support' }),
    { status: 400 },
  );
  assert.throws(
    () => useCase.execute({ userId, targetUserId, roleName: 'x' }),
    { status: 400 },
  );
});

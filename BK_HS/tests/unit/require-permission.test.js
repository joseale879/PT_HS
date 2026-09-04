const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequirePermission } = require('../../src/api/middleware/requirePermission');

test('permite continuar cuando el usuario tiene el permiso', async () => {
  const middleware = createRequirePermission({
    permissionChecker: {
      hasPermission: async (userId, permission) => userId === 'user-1' && permission === 'homes.manage'
    }
  })('homes.manage');
  let nextCalled = false;

  await middleware({ user: { id: 'user-1' } }, {}, (error) => {
    assert.equal(error, undefined);
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('rechaza con 403 cuando el usuario no tiene el permiso', async () => {
  const middleware = createRequirePermission({
    permissionChecker: { hasPermission: async () => false }
  })('devices.manage');
  let receivedError;

  await middleware({ user: { id: 'user-1' } }, {}, (error) => {
    receivedError = error;
  });

  assert.equal(receivedError.status, 403);
});

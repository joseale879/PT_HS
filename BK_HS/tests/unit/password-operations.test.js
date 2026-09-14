const test = require('node:test');
const assert = require('node:assert/strict');
const { ChangePassword } = require('../../src/core/application/use-cases/auth/ChangePassword');

test('cambia la contraseña después de validar la actual', async () => {
  const calls = [];
  const useCase = new ChangePassword({
    authRepository: {
      findCredentialsForUser: async () => ({ accountStatus: 'Active', passwordHash: 'old-hash' }),
      changePasswordHash: async (input) => calls.push(input)
    },
    passwordHasher: {
      compare: async (value, hash) => value === 'Old-password1!' && hash === 'old-hash',
      hash: async (value) => `hash:${value}`
    }
  });

  await useCase.execute({ userId: 'user-1', currentPassword: 'Old-password1!', newPassword: 'New-password2!' });
  assert.deepEqual(calls, [{ userId: 'user-1', passwordHash: 'hash:New-password2!' }]);
});

test('rechaza una contraseña actual incorrecta', async () => {
  const useCase = new ChangePassword({
    authRepository: { findCredentialsForUser: async () => ({ accountStatus: 'Active', passwordHash: 'old-hash' }) },
    passwordHasher: { compare: async () => false }
  });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', currentPassword: 'Wrong-password1!', newPassword: 'New-password2!' }),
    (error) => error.status === 401
  );
});

test('no revierte el cambio si falla el correo posterior', async () => {
  let changed = false;
  const useCase = new ChangePassword({
    authRepository: {
      findCredentialsForUser: async () => ({ accountStatus: 'Active', passwordHash: 'old-hash' }),
      changePasswordHash: async () => { changed = true; },
      findNotificationProfile: async () => ({ recipient: 'user@example.com', name: 'Usuario' })
    },
    passwordHasher: {
      compare: async () => true,
      hash: async () => 'new-hash'
    },
    notificationService: {
      isConfigured: () => true,
      sendPasswordChanged: async () => { throw new Error('SMTP no disponible'); }
    },
    logger: { error: () => {} }
  });

  await useCase.execute({ userId: 'user-1', currentPassword: 'Old-password1!', newPassword: 'New-password2!' });
  assert.equal(changed, true);
});

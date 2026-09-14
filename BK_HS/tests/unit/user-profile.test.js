const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateCurrentUser } = require('../../src/core/application/use-cases/user/UpdateCurrentUser');
const { GetCurrentUser } = require('../../src/core/application/use-cases/user/GetCurrentUser');
test('valida el nombre del perfil', async () => { const useCase = new UpdateCurrentUser({ userRepository: {} }); await assert.rejects(useCase.execute({ userId: 'user-1', fullName: 'A' }), { status: 400 }); });
test('actualiza el perfil del usuario autenticado', async () => { const user = { id: 'user-1', fullName: 'Usuario Hidro' }; const useCase = new UpdateCurrentUser({ userRepository: { updateProfile: async (input) => { assert.equal(input.fullName, 'Usuario Hidro'); return user; } } }); assert.deepEqual(await useCase.execute({ userId: 'user-1', fullName: ' Usuario Hidro ' }), user); });

test('no revierte el perfil si falla el correo de cambio de cuenta', async () => {
  let saved = false;
  const useCase = new UpdateCurrentUser({
    userRepository: { updateProfile: async () => { saved = true; return { id: 'user-1', email: 'user@example.com', fullName: 'Usuario' }; } },
    notificationService: { isConfigured: () => true, sendSensitiveDataChanged: async () => { throw new Error('SMTP no disponible'); } },
    logger: { error: () => {} }
  });

  await useCase.execute({ userId: 'user-1', fullName: 'Usuario', phone: null, city: null });
  assert.equal(saved, true);
});
test('devuelve el usuario autenticado', async () => { const user = { id: 'user-1' }; const useCase = new GetCurrentUser({ userRepository: { findById: async () => user } }); assert.deepEqual(await useCase.execute('user-1'), user); });

const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateCurrentUser } = require('../../src/core/application/use-cases/user/UpdateCurrentUser');
const { GetCurrentUser } = require('../../src/core/application/use-cases/user/GetCurrentUser');
const { UpdateCurrentUserRequest } = require('../../src/core/application/dtos/requests/UpdateCurrentUserRequest');
test('valida el nombre del perfil', async () => { const useCase = new UpdateCurrentUser({ userRepository: {} }); await assert.rejects(useCase.execute({ userId: 'user-1', fullName: 'A' }), { status: 400 }); });
test('actualiza el perfil del usuario autenticado', async () => { const user = { id: 'user-1', fullName: 'Usuario Hidro' }; const useCase = new UpdateCurrentUser({ userRepository: { updateProfile: async (input) => { assert.equal(input.fullName, 'Usuario Hidro'); return user; } } }); assert.deepEqual(await useCase.execute({ userId: 'user-1', fullName: ' Usuario Hidro ' }), user); });

test('permite un teléfono de hasta 60 caracteres y persiste el avatar', async () => {
  const avatar = 'data:image/png;base64,aGVsbG8=';
  const phone = '1'.repeat(60);
  const useCase = new UpdateCurrentUser({
    userRepository: {
      updateProfile: async (input) => {
        assert.equal(input.phone, phone);
        assert.equal(input.avatarDataUrl, avatar);
        return { id: 'user-1', fullName: 'Usuario', phone, avatarDataUrl: avatar };
      }
    }
  });

  const user = await useCase.execute({ userId: 'user-1', fullName: 'Usuario', phone, avatarDataUrl: avatar });
  assert.equal(user.avatarDataUrl, avatar);
});

test('conserva los campos opcionales omitidos en una actualización parcial', async () => {
  const input = UpdateCurrentUserRequest.fromRequest({ full_name: 'Usuario actualizado' });
  assert.equal(input.phone, undefined);
  assert.equal(input.city, undefined);
  assert.equal(input.avatarDataUrl, undefined);

  const useCase = new UpdateCurrentUser({
    userRepository: {
      updateProfile: async (profile) => {
        assert.equal(profile.phone, undefined);
        assert.equal(profile.city, undefined);
        assert.equal(profile.avatarDataUrl, undefined);
        return { id: 'user-1', fullName: profile.fullName };
      }
    }
  });

  await useCase.execute({ userId: 'user-1', ...input });
});

test('permite borrar explícitamente el avatar', async () => {
  const input = UpdateCurrentUserRequest.fromRequest({ fullName: 'Usuario', avatarDataUrl: null });
  assert.equal(input.avatarDataUrl, null);
});

test('rechaza teléfonos que superan 60 caracteres y avatares no permitidos', async () => {
  const useCase = new UpdateCurrentUser({ userRepository: { updateProfile: async () => ({}) } });
  await assert.rejects(
    useCase.execute({ userId: 'user-1', fullName: 'Usuario', phone: '1'.repeat(61) }),
    { status: 400 }
  );
  await assert.rejects(
    useCase.execute({ userId: 'user-1', fullName: 'Usuario', avatarDataUrl: 'data:image/svg+xml;base64,abc' }),
    { status: 400 }
  );
});

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

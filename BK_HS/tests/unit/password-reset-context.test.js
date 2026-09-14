const test = require('node:test');
const assert = require('node:assert/strict');
const { GetPasswordResetContext } = require('../../src/core/application/use-cases/auth/GetPasswordResetContext');

const resetToken = 'a'.repeat(64);

test('devuelve el correo asociado a un token de recuperación vigente', async () => {
  const calls = [];
  const useCase = new GetPasswordResetContext({
    authRepository: {
      findPasswordResetEmail: async (input) => {
        calls.push(input);
        return 'usuario@ejemplo.com';
      }
    },
    tokenService: { hash: (token) => `hash:${token}` }
  });

  assert.deepEqual(await useCase.execute({ resetToken }), { email: 'usuario@ejemplo.com' });
  assert.deepEqual(calls, [{ tokenHash: `hash:${resetToken}` }]);
});

test('rechaza un token de recuperación inválido o expirado', async () => {
  let called = false;
  const useCase = new GetPasswordResetContext({
    authRepository: {
      findPasswordResetEmail: async () => {
        called = true;
        return null;
      }
    },
    tokenService: { hash: () => 'hash' }
  });

  await assert.rejects(
    () => useCase.execute({ resetToken: 'short-token' }),
    (error) => error.status === 401
  );
  assert.equal(called, false);

  await assert.rejects(
    () => useCase.execute({ resetToken }),
    (error) => error.status === 401 && error.message.includes('no es válido')
  );
});

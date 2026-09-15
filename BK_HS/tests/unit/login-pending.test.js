const test = require('node:test');
const assert = require('node:assert/strict');
const { LoginUser } = require('../../src/core/application/use-cases/auth/LoginUser');

test('rechaza el acceso de una cuenta pendiente de verificación', async () => {
  let compared = false;
  const useCase = new LoginUser({
    authRepository: {
      findCredentials: async () => ({
        user_account_id: 'user-1',
        account_status: 'Pending',
        password_hash: 'hash'
      }),
      getLoginSecurityState: async () => null
    },
    passwordHasher: {
      compare: async () => { compared = true; return true; }
    }
  });

  await assert.rejects(
    useCase.execute({ login: 'usuario@example.com', password: 'Segura#123' }),
    { status: 403 }
  );
  assert.equal(compared, false);
});

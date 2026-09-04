const test = require('node:test');
const assert = require('node:assert/strict');
const { LoginUser } = require('../../src/core/application/use-cases/auth/LoginUser');

test('rechaza el login mientras la cuenta está bloqueada', async () => {
  const useCase = new LoginUser({
    authRepository: {
      findCredentials: async () => ({ user_account_id: 'user-1', account_status: 'Active', password_hash: 'hash' }),
      getLoginSecurityState: async () => ({ blockedUntil: new Date(Date.now() + 60_000), requiresChange: false, expirationDays: 0 })
    },
    passwordHasher: { compare: async () => true }
  });
  await assert.rejects(() => useCase.execute({ login: 'user', password: 'anything' }), (error) => error.status === 401);
});

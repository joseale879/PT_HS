const test = require('node:test');
const assert = require('node:assert/strict');
const { AuthSessionService } = require('../../src/core/application/services/auth/AuthSessionService');

const userId = '123e4567-e89b-12d3-a456-426614174000';
const currentSessionId = '123e4567-e89b-12d3-a456-426614174001';
const otherSessionId = '123e4567-e89b-12d3-a456-426614174002';

function buildService(overrides = {}) {
  const repository = {
    listSessions: async () => [],
    revokeSession: async () => true,
    revokeOtherSessions: async () => 1,
    revokeAllSessions: async () => 2,
    ...overrides
  };
  return { service: new AuthSessionService({ authRepository: repository, tokenService: { issue: () => 'access-token' } }), repository };
}

test('lista sesiones usando la identidad autenticada', async () => {
  const sessions = [{ sessionId: currentSessionId, isCurrent: true }];
  const { service, repository } = buildService({ listSessions: async (input) => {
    assert.deepEqual(input, { userId, currentSessionId });
    return sessions;
  } });

  assert.deepEqual(await service.list({ userId, currentSessionId }), sessions);
  assert.ok(repository);
});

test('revoca una sesión propia y rechaza un identificador inválido', async () => {
  const calls = [];
  const { service } = buildService({ revokeSession: async (input) => {
    calls.push(input);
    return true;
  } });

  await service.revokeSession({ userId, sessionId: otherSessionId });
  assert.deepEqual(calls, [{ userId, sessionId: otherSessionId }]);
  await assert.rejects(
    () => service.revokeSession({ userId, sessionId: 'not-a-uuid' }),
    (error) => error.status === 400
  );
});

test('devuelve el número de sesiones revocadas', async () => {
  const { service } = buildService({ revokeOtherSessions: async () => 3, revokeAllSessions: async () => 4 });

  assert.equal(await service.revokeOtherSessions({ userId, currentSessionId }), 3);
  assert.equal(await service.revokeAllSessions({ userId }), 4);
});

test('no permite operar sesiones sin identidad válida', async () => {
  const { service } = buildService();

  await assert.rejects(
    () => service.list({ userId: 'not-a-uuid', currentSessionId }),
    (error) => error.status === 401
  );
  await assert.rejects(
    () => service.revokeAllSessions({ userId: undefined }),
    (error) => error.status === 401
  );
});

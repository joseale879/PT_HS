const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateHome } = require('../../src/core/application/use-cases/home/UpdateHome');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('actualiza un hogar válido', async () => {
  let received;
  const useCase = new UpdateHome({
    homeRepository: {
      updateForUser: async (home, userId) => {
        received = { home, userId };
        return home;
      }
    }
  });

  const result = await useCase.execute({
    userId: 'user-1',
    homeId: validHomeId,
    name: 'Casa actualizada',
    address: 'Carrera 10 # 20-30',
    city: 'Bogotá',
    tier: 3
  });

  assert.equal(received.userId, 'user-1');
  assert.equal(received.home.id, validHomeId);
  assert.equal(result.name, 'Casa actualizada');
  assert.equal(result.tier, 3);
});

test('rechaza un hogar inválido', async () => {
  const useCase = new UpdateHome({ homeRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', homeId: 'invalid', name: 'Casa', address: 'Calle 1', city: 'Bogotá', tier: 2 }),
    (error) => error.status === 400
  );
});

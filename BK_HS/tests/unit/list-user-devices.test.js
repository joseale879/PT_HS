const test = require('node:test');
const assert = require('node:assert/strict');
const { ListUserDevices } = require('../../src/core/application/use-cases/device/ListUserDevices');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('lista los dispositivos del usuario filtrados por hogar', async () => {
  let received;
  const useCase = new ListUserDevices({
    deviceRepository: {
      findByUserId: async (userId, homeId) => {
        received = { userId, homeId };
        return [];
      }
    }
  });

  await useCase.execute({ userId: 'user-1', homeId: validHomeId });

  assert.deepEqual(received, { userId: 'user-1', homeId: validHomeId });
});

test('rechaza un filtro de hogar inválido', async () => {
  const useCase = new ListUserDevices({ deviceRepository: {} });

  assert.throws(
    () => useCase.execute({ userId: 'user-1', homeId: 'invalid' }),
    (error) => error.status === 400 && error.message === 'homeId no es válido'
  );
});

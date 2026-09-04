const test = require('node:test');
const assert = require('node:assert/strict');
const { RegisterDevice } = require('../../src/core/application/use-cases/device/RegisterDevice');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('registra el dispositivo asociado al hogar', async () => {
  let received;
  const useCase = new RegisterDevice({
    deviceRepository: {
      register: async (device, userId, homeId) => {
        received = { device, userId, homeId };
        return device;
      }
    }
  });

  await useCase.execute({
    userId: 'user-1',
    homeId: validHomeId,
    code: 'ESP32-001',
    name: 'Medidor principal',
    type: 'YF-S201'
  });

  assert.equal(received.userId, 'user-1');
  assert.equal(received.homeId, validHomeId);
  assert.equal(received.device.code, 'ESP32-001');
});

test('rechaza un hogar inválido al registrar el dispositivo', async () => {
  const useCase = new RegisterDevice({ deviceRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', homeId: 'invalid', code: 'ESP32-001', name: 'Medidor', type: 'YF-S201' }),
    (error) => error.status === 400 && error.message === 'homeId no es válido'
  );
});

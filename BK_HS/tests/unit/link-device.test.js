const test = require('node:test');
const assert = require('node:assert/strict');
const { LinkDeviceToHome } = require('../../src/core/application/use-cases/device/LinkDeviceToHome');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('vincula un dispositivo existente usando su código técnico', async () => {
  let received;
  const device = { id: 'device-1', code: 'ESP32-001' };
  const useCase = new LinkDeviceToHome({
    deviceRepository: {
      linkToHome: async (input) => {
        received = input;
        return device;
      }
    }
  });

  const result = await useCase.execute({
    userId: 'user-1',
    homeId: validHomeId,
    code: ' ESP32-001 '
  });

  assert.deepEqual(received, { userId: 'user-1', homeId: validHomeId, code: 'ESP32-001' });
  assert.equal(result, device);
});

test('devuelve 404 si el código no corresponde a un dispositivo activo', async () => {
  const useCase = new LinkDeviceToHome({
    deviceRepository: { linkToHome: async () => null }
  });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', homeId: validHomeId, code: 'ESP32-404' }),
    (error) => error.status === 404
  );
});

test('valida el hogar y el código antes de consultar la base', async () => {
  const useCase = new LinkDeviceToHome({ deviceRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', homeId: 'invalid', code: 'ESP32-001' }),
    (error) => error.status === 400
  );

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', homeId: validHomeId, code: 'x' }),
    (error) => error.status === 400
  );
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { ClaimDeviceHardware } = require('../../src/core/application/use-cases/device/ClaimDeviceHardware');
const { GetDeviceByHardware } = require('../../src/core/application/use-cases/device/GetDeviceByHardware');

const validDeviceId = '123e4567-e89b-12d3-a456-426614174000';

test('asocia el hardware físico al dispositivo lógico', async () => {
  let received;
  const device = { id: validDeviceId, code: 'ESP32-001', hardwareId: 'HS-141F47470968' };
  const useCase = new ClaimDeviceHardware({
    deviceRepository: {
      claimHardwareForUser: async (input) => {
        received = input;
        return device;
      }
    }
  });

  const result = await useCase.execute({
    userId: 'user-1',
    deviceId: validDeviceId,
    hardwareId: ' HS-141F47470968 '
  });

  assert.deepEqual(received, {
    userId: 'user-1',
    deviceId: validDeviceId,
    hardwareId: 'HS-141F47470968'
  });
  assert.equal(result, device);
});

test('rechaza hardware inválido y conserva la validación antes del repositorio', async () => {
  const useCase = new ClaimDeviceHardware({ deviceRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', deviceId: validDeviceId, hardwareId: 'no válido' }),
    (error) => error.status === 400
  );
});

test('consulta un dispositivo accesible por hardwareId', async () => {
  let received;
  const device = { id: validDeviceId, code: 'ESP32-001', hardwareId: 'HS-141F47470968' };
  const useCase = new GetDeviceByHardware({
    deviceRepository: {
      findByHardwareIdForUser: async (hardwareId, userId) => {
        received = { hardwareId, userId };
        return device;
      }
    }
  });

  const result = await useCase.execute({ userId: 'user-1', hardwareId: 'HS-141F47470968' });

  assert.deepEqual(received, { hardwareId: 'HS-141F47470968', userId: 'user-1' });
  assert.equal(result, device);
});

test('devuelve 404 si el hardware no es accesible para el usuario', async () => {
  const useCase = new GetDeviceByHardware({
    deviceRepository: { findByHardwareIdForUser: async () => null }
  });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', hardwareId: 'HS-404404404040' }),
    (error) => error.status === 404
  );
});

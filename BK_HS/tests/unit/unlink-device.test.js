const test = require('node:test');
const assert = require('node:assert/strict');
const { UnlinkDeviceFromHome } = require('../../src/core/application/use-cases/device/UnlinkDeviceFromHome');

const validDeviceId = '123e4567-e89b-12d3-a456-426614174000';
const validHomeId = '223e4567-e89b-12d3-a456-426614174000';

test('desvincula un dispositivo del hogar', async () => {
  let received;
  const useCase = new UnlinkDeviceFromHome({
    deviceRepository: {
      unlinkFromHome: async (input) => {
        received = input;
        return { device_id: validDeviceId, home_id: validHomeId };
      }
    }
  });

  await useCase.execute({ userId: 'user-1', deviceId: validDeviceId, homeId: validHomeId });

  assert.deepEqual(received, { userId: 'user-1', deviceId: validDeviceId, homeId: validHomeId });
});

test('rechaza identificadores inválidos', async () => {
  const useCase = new UnlinkDeviceFromHome({ deviceRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', deviceId: 'invalid', homeId: validHomeId }),
    (error) => error.status === 400
  );
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { DeactivateDevice } = require('../../src/core/application/use-cases/device/DeactivateDevice');

test('desactiva un dispositivo usando el estado suspendido', async () => {
  let received;
  const useCase = new DeactivateDevice({
    updateDeviceStatus: {
      execute: async (input) => {
        received = input;
        return { status: 'Suspended' };
      }
    }
  });

  const result = await useCase.execute({ userId: 'user-1', deviceId: 'device-1', reason: 'Mantenimiento' });

  assert.deepEqual(received, {
    userId: 'user-1',
    deviceId: 'device-1',
    status: 'Suspended',
    reason: 'Mantenimiento'
  });
  assert.equal(result.status, 'Suspended');
});

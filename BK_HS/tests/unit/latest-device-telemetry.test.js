const test = require('node:test');
const assert = require('node:assert/strict');
const { GetLatestDeviceTelemetry } = require('../../src/core/application/use-cases/device/GetLatestDeviceTelemetry');

const validDeviceId = '123e4567-e89b-12d3-a456-426614174000';

test('obtiene la ultima telemetria del dispositivo autorizado', async () => {
  let received;
  const telemetry = { readingId: 'reading-1', flowRateLpm: 3.2 };
  const useCase = new GetLatestDeviceTelemetry({
    deviceRepository: {
      findLatestTelemetryForUser: async (deviceId, userId) => {
        received = { deviceId, userId };
        return telemetry;
      }
    }
  });

  const result = await useCase.execute({ userId: 'user-1', deviceId: validDeviceId });

  assert.deepEqual(received, { deviceId: validDeviceId, userId: 'user-1' });
  assert.deepEqual(result, telemetry);
});

test('devuelve null si el dispositivo aun no tiene lecturas', async () => {
  const useCase = new GetLatestDeviceTelemetry({
    deviceRepository: { findLatestTelemetryForUser: async () => null }
  });

  assert.equal(await useCase.execute({ userId: 'user-1', deviceId: validDeviceId }), null);
});

test('rechaza un identificador de dispositivo invalido', async () => {
  const useCase = new GetLatestDeviceTelemetry({ deviceRepository: {} });

  await assert.rejects(
    () => useCase.execute({ userId: 'user-1', deviceId: 'ESP32-001' }),
    (error) => error.status === 400
  );
});

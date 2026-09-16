const test = require('node:test');
const assert = require('node:assert/strict');
const { IngestReading } = require('../../src/core/application/use-cases/telemetry/IngestReading');

test('IngestReading delega una lectura válida al repositorio de telemetría', async () => {
  const calls = [];
  const useCase = new IngestReading({
    telemetryRepository: {
      ingestTelemetry: async (reading) => {
        calls.push(reading);
        return { inserted: true, duplicate: false };
      },
    },
  });

  const result = await useCase.execute({
    deviceCode: ' HS_ESP32_001 ',
    mqttMessageId: ' msg-001 ',
    consumptionLiters: 1.25,
    recordedAt: '2026-09-13T00:00:00.000Z',
  });

  assert.deepEqual(result, { inserted: true, duplicate: false });
  assert.deepEqual(calls, [{
    deviceCode: 'HS_ESP32_001',
    mqttMessageId: 'msg-001',
    consumptionLiters: 1.25,
    recordedAt: '2026-09-13T00:00:00.000Z',
  }]);
});

test('IngestReading rechaza identificadores o consumo inválidos', async () => {
  const useCase = new IngestReading({ telemetryRepository: { ingestTelemetry: async () => null } });

  await assert.rejects(
    () => useCase.execute({ deviceCode: '', mqttMessageId: 'msg-001', consumptionLiters: 1 }),
    (error) => error.status === 400 && error.message === 'deviceCode es obligatorio'
  );
  await assert.rejects(
    () => useCase.execute({ deviceCode: 'HS_ESP32_001', mqttMessageId: 'msg-001', consumptionLiters: -1 }),
    (error) => error.status === 400 && error.message === 'consumptionLiters no es válido'
  );
});

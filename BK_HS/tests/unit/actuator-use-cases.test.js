const test = require('node:test');
const assert = require('node:assert/strict');
const {
  SendActuatorCommand,
  ListActuatorCommands
} = require('../../src/core/application/use-cases/actuator/ActuatorOperations');

const userId = '11111111-1111-4111-8111-111111111111';
const deviceId = '22222222-2222-4222-8222-222222222222';
const correlationId = '33333333-3333-4333-8333-333333333333';

test('crea y publica un comando de válvula con correlationId', async () => {
  const published = [];
  const repository = {
    async createPending(input) {
      assert.deepEqual(input, {
        userId,
        deviceId,
        actuator: 'VALVE',
        command: 'OPEN',
        correlationId
      });
      return { commandId: '44444444-4444-4444-8444-444444444444', deviceCode: 'HS_ESP32_001' };
    },
    async markPublished(input) {
      assert.equal(input.commandId, '44444444-4444-4444-8444-444444444444');
      return { ...input, status: 'Published' };
    },
    async markFailed() { throw new Error('no debía marcar fallo'); }
  };
  const publisher = {
    async publish(topic, payload, options) {
      published.push({ topic, payload, options });
    }
  };
  const useCase = new SendActuatorCommand({
    repository,
    publisher,
    clock: () => new Date('2026-09-13T12:00:00.000Z')
  });

  const result = await useCase.execute({ userId, deviceId, actuator: 'valve', command: 'open', correlationId });

  assert.equal(result.status, 'Published');
  assert.deepEqual(published, [{
    topic: 'hidrosmart/devices/HS_ESP32_001/actuators/valve/command',
    payload: {
      actuator: 'VALVE',
      command: 'OPEN',
      correlationId,
      timestamp: '2026-09-13T12:00:00.000Z'
    },
    options: { qos: 1, retain: false }
  }]);
});

test('marca el comando como fallido cuando Mosquitto no publica', async () => {
  let failed;
  const repository = {
    async createPending() { return { commandId: '44444444-4444-4444-8444-444444444444', deviceCode: 'HS_ESP32_001' }; },
    async markFailed(input) { failed = input; return input; }
  };
  const useCase = new SendActuatorCommand({
    repository,
    publisher: { async publish() { throw new Error('broker no disponible'); } }
  });

  await assert.rejects(
    useCase.execute({ userId, deviceId, actuator: 'PUMP', command: 'ON' }),
    (error) => error.status === 503 && /publicar/.test(error.message)
  );
  assert.equal(failed.commandId, '44444444-4444-4444-8444-444444444444');
  assert.equal(failed.errorMessage, 'broker no disponible');
});

test('rechaza una orden incompatible con el tipo de actuador', async () => {
  const useCase = new SendActuatorCommand({ repository: {}, publisher: {} });
  await assert.rejects(
    useCase.execute({ userId, deviceId, actuator: 'VALVE', command: 'ON' }),
    (error) => error.status === 400 && /command/.test(error.message)
  );
});

test('rechaza filtros de comandos desconocidos', async () => {
  const useCase = new ListActuatorCommands({ repository: { listCommands: async () => [] } });
  assert.throws(
    () => useCase.execute({ userId, status: 'Unknown' }),
    (error) => error.status === 400 && /status/.test(error.message)
  );
});

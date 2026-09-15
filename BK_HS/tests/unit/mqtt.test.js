const { EventEmitter } = require('node:events');
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TOPICS,
  telemetryTopic,
  actuatorCommandTopic,
  getTopicContext
} = require('../../src/mqtt/topics');
const { parseTelemetryMessage, rssiToSignalQuality } = require('../../src/mqtt/message-parser');
const { handleReading } = require('../../src/mqtt/handlers/reading.handler');
const { handleActuatorStatus } = require('../../src/mqtt/handlers/actuator-status.handler');
const { MqttSubscriber } = require('../../src/core/infrastructure/services/mqtt/MqttSubscriber');
const { MqttPublisher } = require('../../src/core/infrastructure/services/mqtt/MqttPublisher');
const { getMqttConfig } = require('../../src/config/mqtt');

const silentLogger = { info() {}, warn() {}, error() {} };

test('persiste la confirmacion de un actuador desde MQTT', async () => {
  let persistenceInput;
  const result = await handleActuatorStatus({
    topic: 'hidrosmart/devices/ESP32-001/actuators/valve/status',
    message: JSON.stringify({
      actuator: 'VALVE',
      status: 'OPEN',
      correlationId: '550e8400-e29b-41d4-a716-446655440000',
      timestamp: '2026-09-14T12:00:00Z'
    }),
    logger: silentLogger,
    deviceRepository: {
      recordMqttActuatorStatus: async (input) => {
        persistenceInput = input;
        return { commandStatus: 'Acknowledged' };
      }
    }
  });

  assert.equal(result.status, 'OPEN');
  assert.deepEqual(persistenceInput, {
    deviceCode: 'ESP32-001',
    actuator: 'VALVE',
    status: 'OPEN',
    correlationId: '550e8400-e29b-41d4-a716-446655440000',
    reportedAt: '2026-09-14T12:00:00.000Z'
  });
});

test('obtiene la configuración MQTT del entorno y restringe el QoS', () => {
  const config = getMqttConfig({
    MQTT_BROKER_URL: 'mqtt://localhost:1883',
    MQTT_CLIENT_ID: 'hidrosmart-test',
    MQTT_QOS: '1'
  });

  assert.equal(config.brokerUrl, 'mqtt://localhost:1883');
  assert.equal(config.options.clientId, 'hidrosmart-test');
  assert.equal(config.qos, 1);
  assert.equal(config.allowLegacyTelemetry, true);
  assert.equal(getMqttConfig({
    MQTT_BROKER_URL: 'mqtt://localhost:1883',
    MQTT_ALLOW_LEGACY_TELEMETRY: 'false'
  }).allowLegacyTelemetry, false);
  assert.throws(
    () => getMqttConfig({ MQTT_BROKER_URL: 'mqtt://localhost:1883', MQTT_QOS: '3' }),
    /MQTT_QOS debe ser 0, 1 o 2/
  );
});

test('centraliza los topics MQTT con el formato definitivo del SRS', () => {
  assert.equal(telemetryTopic('ESP32-001'), 'hidrosmart/devices/ESP32-001/telemetry');
  assert.equal(actuatorCommandTopic('ESP32-001', 'valve'), 'hidrosmart/devices/ESP32-001/actuators/valve/command');
  assert.deepEqual(getTopicContext('hidrosmart/devices/ESP32-001/telemetry'), {
    deviceId: 'ESP32-001',
    type: 'telemetry'
  });
  assert.equal(getTopicContext('hidro-smart/device/ESP32-001/reading'), null);
});

test('valida y normaliza una telemetría MQTT', () => {
  const telemetry = parseTelemetryMessage(Buffer.from(JSON.stringify({
    flowRateLpm: 2.4,
    consumptionLiters: 0.04,
    totalLiters: 3.407,
    pulses: 18,
    signalQuality: -56,
    batteryLevel: 78,
    voltage: 5,
    temperature: 25,
    timestamp: '2026-09-04T12:00:00Z'
  })));

  assert.equal(telemetry.flowRateLpm, 2.4);
  assert.equal(telemetry.consumptionLiters, 0.04);
  assert.equal(telemetry.pulses, 18);
  assert.equal(telemetry.wifiRssiDbm, -56);
  assert.equal(telemetry.signalQuality, 88);
  assert.equal(telemetry.batteryLevel, 78);
  assert.equal(telemetry.timestamp, '2026-09-04T12:00:00.000Z');
});

test('persiste el payload legado del ESP32 generando un identificador de transición', async () => {
  let persistenceInput;
  const result = await handleReading({
    topic: telemetryTopic('ESP32-001'),
    message: JSON.stringify({
      deviceId: 'ESP32-001',
      flowRateLpm: 3.973,
      consumptionLiters: 0.33111,
      totalLiters: 9.27556,
      pulses: 149,
      sampleIntervalSeconds: 5.001,
      signalQuality: -33
    }),
    logger: silentLogger,
    readingRepository: {
      ingestTelemetry: async (input) => {
        persistenceInput = input;
        return { inserted: true, duplicate: false };
      }
    }
  });

  assert.match(result.mqttMessageId, /^legacy-ESP32-001-[0-9a-f-]{36}$/);
  assert.equal(result.mqttMessageIdGenerated, true);
  assert.equal(persistenceInput.mqttMessageId, result.mqttMessageId);
  assert.equal(persistenceInput.flowRateLpm, 3.973);
  assert.equal(persistenceInput.consumptionLiters, 0.33111);
  assert.equal(persistenceInput.totalLiters, 9.27556);
  assert.equal(persistenceInput.pulses, 149);
  assert.equal(persistenceInput.sampleIntervalSeconds, 5.001);
  assert.equal(persistenceInput.wifiRssiDbm, -33);
  assert.equal(persistenceInput.signalQuality, 100);
});

test('permite desactivar la compatibilidad con payloads MQTT legados', async () => {
  await assert.rejects(
    handleReading({
      topic: telemetryTopic('ESP32-001'),
      message: JSON.stringify({ flowRateLpm: 1, consumptionLiters: 0.01 }),
      logger: silentLogger,
      readingRepository: { ingestTelemetry: async () => null },
      allowLegacyTelemetry: false
    }),
    /mqttMessageId es obligatorio/
  );
});

test('normaliza offsets ISO-8601 a UTC y rechaza timestamps sin zona horaria', () => {
  const telemetry = parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"timestamp":"2026-09-04T10:30:00-05:00"}');
  assert.equal(telemetry.timestamp, '2026-09-04T15:30:00.000Z');

  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"timestamp":"2026-09-04T10:30:00"}'),
    /timestamp debe ser una fecha ISO válida/
  );
  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"timestamp":"2026-09-04"}'),
    /timestamp debe ser una fecha ISO válida/
  );
});

test('acepta calidad porcentual o RSSI Wi-Fi y rechaza métricas fuera de rango', () => {
  const percentageTelemetry = parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"signalQuality":88}');
  assert.equal(percentageTelemetry.wifiRssiDbm, null);
  assert.equal(percentageTelemetry.signalQuality, 88);
  assert.equal(rssiToSignalQuality(-56), 88);

  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"pulses":2.5}'),
    /pulses debe ser un entero/
  );
  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"signalQuality":-128}'),
    /signalQuality RSSI/
  );
  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":1,"consumptionLiters":0.01,"batteryLevel":101}'),
    /batteryLevel/
  );
});

test('rechaza telemetría inválida y deviceId falsificado', async () => {
  assert.throws(
    () => parseTelemetryMessage('{"flowRateLpm":-1,"consumptionLiters":0}'),
    /flowRateLpm/
  );

  await assert.rejects(
    handleReading({
      topic: telemetryTopic('ESP32-001'),
      message: Buffer.from('{"flowRateLpm":1,"consumptionLiters":1,"deviceId":"ESP32-002"}'),
      logger: silentLogger
    }),
    /no coincide/
  );
});

test('subscriber enruta telemetría, estados y confirmaciones de actuador', async () => {
  class FakeClient extends EventEmitter {
    constructor() {
      super();
      this.connected = false;
      this.topics = [];
    }

    subscribe(topics, _options, callback) {
      this.topics = topics;
      callback(null);
    }
  }

  const client = new FakeClient();
  const events = [];
  const subscriber = new MqttSubscriber({
    mqttClient: { connect: () => client, disconnect: async () => {} },
    logger: silentLogger,
    handlers: {
      telemetry: async ({ context }) => events.push(context.type),
      'device-status': async ({ context }) => events.push(context.type),
      'actuator-status': async ({ context }) => events.push(context.type)
    }
  });

  subscriber.start();
  client.emit('connect');
  assert.deepEqual(client.topics, [TOPICS.TELEMETRY, TOPICS.STATUS, TOPICS.ACTUATOR_STATUS]);

  client.emit('message', telemetryTopic('ESP32-001'), Buffer.from('{}'));
  client.emit('message', 'hidrosmart/devices/ESP32-001/status', Buffer.from('{}'));
  client.emit('message', 'hidrosmart/devices/ESP32-001/actuators/valve/status', Buffer.from('{}'));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(events, ['telemetry', 'device-status', 'actuator-status']);
  await subscriber.stop();
});

test('publisher serializa los comandos y usa QoS 1 por defecto', async () => {
  const sent = [];
  const publisher = new MqttPublisher({
    mqttClient: {
      connect: () => ({
        publish(topic, message, options, callback) {
          sent.push({ topic, message, options });
          callback(null);
        }
      })
    },
    logger: silentLogger
  });

  await publisher.publish('hidrosmart/devices/ESP32-001/actuators/valve/command', { command: 'OPEN' });
  assert.deepEqual(sent, [{
    topic: 'hidrosmart/devices/ESP32-001/actuators/valve/command',
    message: '{"command":"OPEN"}',
    options: { qos: 1, retain: false }
  }]);
});

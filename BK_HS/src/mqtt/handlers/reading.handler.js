const { randomUUID } = require('node:crypto');
const { parseTelemetryMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

function assertReportedDevice(context, reportedDeviceId) {
  if (reportedDeviceId && reportedDeviceId !== context.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }
}

async function handleReading({ topic, message, context, logger = console, readingRepository = null, ingestReading = null, maxPayloadBytes, allowLegacyTelemetry = true }) {
  const topicContext = context || getTopicContext(topic);
  if (!topicContext || topicContext.type !== 'telemetry') {
    throw new Error(`Topic MQTT de telemetría inválido: ${topic}`);
  }

  const telemetry = parseTelemetryMessage(message, { maxPayloadBytes });
  assertReportedDevice(topicContext, telemetry.reportedDeviceId);
  const usedLegacyMessageId = !telemetry.mqttMessageId;
  if (usedLegacyMessageId && !allowLegacyTelemetry) {
    throw new Error('mqttMessageId es obligatorio para persistir una lectura MQTT');
  }

  // El firmware actualmente instalado publica las métricas correctamente,
  // pero no incluye mqttMessageId. Generamos un identificador único solo como
  // compatibilidad de transición para no perder esas lecturas. El firmware
  // actualizado seguirá enviando su propio identificador y mantendrá la
  // deduplicación MQTT de extremo a extremo.
  const mqttMessageId = telemetry.mqttMessageId || `legacy-${topicContext.deviceId}-${randomUUID()}`;

  const reading = {
    deviceId: topicContext.deviceId,
    flowRateLpm: telemetry.flowRateLpm,
    consumptionLiters: telemetry.consumptionLiters,
    totalLiters: telemetry.totalLiters,
    pulses: telemetry.pulses,
    sampleIntervalSeconds: telemetry.sampleIntervalSeconds,
    wifiRssiDbm: telemetry.wifiRssiDbm,
    signalQuality: telemetry.signalQuality,
    batteryLevel: telemetry.batteryLevel,
    voltage: telemetry.voltage,
    temperature: telemetry.temperature,
    timestamp: telemetry.timestamp,
    mqttMessageId,
    mqttMessageIdGenerated: usedLegacyMessageId
  };

  const persistenceInput = {
      deviceCode: reading.deviceId,
      mqttMessageId: reading.mqttMessageId,
      consumptionLiters: reading.consumptionLiters,
      recordedAt: reading.timestamp,
      flowRateLpm: reading.flowRateLpm,
      totalLiters: reading.totalLiters,
      pulses: reading.pulses,
      sampleIntervalSeconds: reading.sampleIntervalSeconds,
      wifiRssiDbm: reading.wifiRssiDbm,
      signalQuality: reading.signalQuality,
      batteryLevel: reading.batteryLevel,
      voltage: reading.voltage,
      temperature: reading.temperature
    };
  const persistence = ingestReading
    ? await ingestReading.execute(persistenceInput)
    : readingRepository
      ? await readingRepository.ingestTelemetry(persistenceInput)
      : null;

  const result = { ...reading, persistence };
  logger.info('[MQTT] Lectura de telemetría recibida', result);
  return result;
}

module.exports = { handleReading };

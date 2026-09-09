const { parseTelemetryMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

function assertReportedDevice(context, reportedDeviceId) {
  if (reportedDeviceId && reportedDeviceId !== context.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }
}

function buildReadingFromTelemetry(topicContext, telemetry) {
  return {
    // Código que viene desde el topic:
    // hidrosmart/devices/ESP32-001/telemetry
    deviceCode: topicContext.deviceId,

    // Lo dejo también como deviceId para compatibilidad con tu parser/tests actuales.
    // En este punto todavía NO es el UUID de PostgreSQL, es el código del ESP32.
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

    timestamp: telemetry.timestamp
  };
}

async function persistReading(readingRepository, reading) {
  if (!readingRepository) {
    return null;
  }

  if (typeof readingRepository.saveFromMqtt === 'function') {
    return readingRepository.saveFromMqtt(reading);
  }

  if (typeof readingRepository.save === 'function') {
    return readingRepository.save(reading);
  }

  throw new Error('readingRepository debe implementar saveFromMqtt(reading) o save(reading)');
}

async function handleReading({
  topic,
  message,
  context,
  logger = console,
  readingRepository = null
}) {
  const topicContext = context || getTopicContext(topic);

  if (!topicContext || topicContext.type !== 'telemetry') {
    throw new Error(`Topic MQTT de telemetría inválido: ${topic}`);
  }

  const telemetry = parseTelemetryMessage(message);

  assertReportedDevice(topicContext, telemetry.reportedDeviceId);

  const reading = buildReadingFromTelemetry(topicContext, telemetry);

  logger.info('[MQTT] Lectura de telemetría recibida', {
    deviceCode: reading.deviceCode,
    flowRateLpm: reading.flowRateLpm,
    consumptionLiters: reading.consumptionLiters,
    totalLiters: reading.totalLiters,
    pulses: reading.pulses,
    sampleIntervalSeconds: reading.sampleIntervalSeconds,
    signalQuality: reading.signalQuality,
    timestamp: reading.timestamp
  });

  const savedReading = await persistReading(readingRepository, reading);

  if (savedReading) {
    logger.info('[MQTT] Lectura de telemetría persistida', {
      readingId: savedReading.readingId,
      deviceCode: savedReading.deviceCode,
      deviceId: savedReading.deviceId,
      homeId: savedReading.homeId,
      recordedAt: savedReading.recordedAt
    });
  } else {
    logger.warn(
      '[MQTT] Lectura recibida pero no persistida: readingRepository no fue inyectado'
    );
  }

  return {
    reading,
    savedReading
  };
}

module.exports = {
  handleReading,
  buildReadingFromTelemetry
};
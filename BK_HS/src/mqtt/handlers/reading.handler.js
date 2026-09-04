const { parseTelemetryMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

function assertReportedDevice(context, reportedDeviceId) {
  if (reportedDeviceId && reportedDeviceId !== context.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }
}

async function handleReading({ topic, message, context, logger = console }) {
  const topicContext = context || getTopicContext(topic);
  if (!topicContext || topicContext.type !== 'telemetry') {
    throw new Error(`Topic MQTT de telemetría inválido: ${topic}`);
  }

  const telemetry = parseTelemetryMessage(message);
  assertReportedDevice(topicContext, telemetry.reportedDeviceId);

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
    timestamp: telemetry.timestamp
  };

  // La persistencia se conectará con ReceiveReading cuando exista el mapeo seguro ESP32 -> device_id -> home_id
  // y una clave de idempotencia para manejar reentregas de MQTT QoS 1.
  logger.info('[MQTT] Lectura de telemetría recibida', reading);
  return reading;
}

module.exports = { handleReading };

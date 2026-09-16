const { parseActuatorStatusMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

async function handleActuatorStatus({ topic, message, context, logger = console, maxPayloadBytes, deviceRepository = null }) {
  const topicContext = context || getTopicContext(topic);
  if (!topicContext || topicContext.type !== 'actuator-status') {
    throw new Error(`Topic MQTT de actuador inválido: ${topic}`);
  }

  const actuatorStatus = parseActuatorStatusMessage(message, { maxPayloadBytes });
  if (actuatorStatus.reportedDeviceId && actuatorStatus.reportedDeviceId !== topicContext.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }
  if (actuatorStatus.actuator !== topicContext.actuator.toUpperCase()) {
    throw new Error('actuator del mensaje no coincide con el topic MQTT');
  }

  const status = {
    deviceId: topicContext.deviceId,
    actuator: actuatorStatus.actuator,
    status: actuatorStatus.status,
    correlationId: actuatorStatus.correlationId,
    timestamp: actuatorStatus.timestamp
  };

  if (deviceRepository) {
    status.persistence = await deviceRepository.recordMqttActuatorStatus({
      deviceCode: status.deviceId,
      actuator: status.actuator,
      status: status.status,
      correlationId: status.correlationId,
      reportedAt: status.timestamp
    });
  }

  logger.info('[MQTT] Estado de actuador recibido', status);
  return status;
}

module.exports = { handleActuatorStatus };

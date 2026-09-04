const { parseDeviceStatusMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

async function handleDeviceStatus({ topic, message, context, logger = console }) {
  const topicContext = context || getTopicContext(topic);
  if (!topicContext || topicContext.type !== 'device-status') {
    throw new Error(`Topic MQTT de estado inválido: ${topic}`);
  }

  const deviceStatus = parseDeviceStatusMessage(message);
  if (deviceStatus.reportedDeviceId && deviceStatus.reportedDeviceId !== topicContext.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }

  const status = {
    deviceId: topicContext.deviceId,
    status: deviceStatus.status,
    timestamp: deviceStatus.timestamp
  };

  logger.info('[MQTT] Estado de dispositivo recibido', status);
  return status;
}

module.exports = { handleDeviceStatus };

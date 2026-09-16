const { parseDeviceStatusMessage } = require('../message-parser');
const { getTopicContext } = require('../topics');

async function handleDeviceStatus({ topic, message, context, logger = console, maxPayloadBytes, deviceRepository = null }) {
  const topicContext = context || getTopicContext(topic);
  if (!topicContext || topicContext.type !== 'device-status') {
    throw new Error(`Topic MQTT de estado inválido: ${topic}`);
  }

  const deviceStatus = parseDeviceStatusMessage(message, { maxPayloadBytes });
  if (deviceStatus.reportedDeviceId && deviceStatus.reportedDeviceId !== topicContext.deviceId) {
    throw new Error('deviceId del mensaje no coincide con el topic MQTT');
  }

  const status = {
    deviceId: topicContext.deviceId,
    hardwareId: deviceStatus.hardwareId,
    status: deviceStatus.status,
    timestamp: deviceStatus.timestamp,
    firmwareVersion: deviceStatus.firmwareVersion,
    wifiRssiDbm: deviceStatus.wifiRssiDbm,
    signalQuality: deviceStatus.signalQuality,
    batteryLevel: deviceStatus.batteryLevel,
    lastIp: deviceStatus.lastIp,
    wifiSsid: deviceStatus.wifiSsid,
    provisioningStatus: deviceStatus.provisioningStatus
  };

  if (deviceRepository) {
    status.persistence = await deviceRepository.recordMqttStatus({
      deviceCode: status.deviceId,
      connectivityStatus: status.status,
      eventAt: status.timestamp,
      firmwareVersion: status.firmwareVersion,
      wifiRssiDbm: status.wifiRssiDbm,
      signalQuality: status.signalQuality,
      batteryLevel: status.batteryLevel,
      lastIp: status.lastIp,
      wifiSsid: status.wifiSsid,
      hardwareId: status.hardwareId,
      provisioningStatus: status.provisioningStatus
    });
  }

  logger.info('[MQTT] Estado de dispositivo recibido', status);
  return status;
}

module.exports = { handleDeviceStatus };

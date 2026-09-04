const BASE_TOPIC = 'hidrosmart/devices';

const TOPICS = {
  TELEMETRY: `${BASE_TOPIC}/+/telemetry`,
  STATUS: `${BASE_TOPIC}/+/status`,
  ACTUATOR_STATUS: `${BASE_TOPIC}/+/actuators/+/status`
};

function assertTopicSegment(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`${label} debe contener solo letras, números, guiones o guiones bajos`);
  }

  return value;
}

function deviceTopic(deviceId, suffix) {
  return `${BASE_TOPIC}/${assertTopicSegment(deviceId, 'deviceId')}/${suffix}`;
}

function telemetryTopic(deviceId) {
  return deviceTopic(deviceId, 'telemetry');
}

function statusTopic(deviceId) {
  return deviceTopic(deviceId, 'status');
}

function configTopic(deviceId) {
  return deviceTopic(deviceId, 'config');
}

function actuatorStatusTopic(deviceId, actuator) {
  return deviceTopic(deviceId, `actuators/${assertTopicSegment(actuator, 'actuator')}/status`);
}

function actuatorCommandTopic(deviceId, actuator) {
  return deviceTopic(deviceId, `actuators/${assertTopicSegment(actuator, 'actuator')}/command`);
}

function getTopicContext(topic) {
  if (typeof topic !== 'string') return null;

  const parts = topic.split('/');
  if (parts[0] !== 'hidrosmart' || parts[1] !== 'devices' || !/^[A-Za-z0-9_-]+$/.test(parts[2] || '')) {
    return null;
  }

  if (parts.length === 4 && parts[3] === 'telemetry') {
    return { deviceId: parts[2], type: 'telemetry' };
  }

  if (parts.length === 4 && parts[3] === 'status') {
    return { deviceId: parts[2], type: 'device-status' };
  }

  if (parts.length === 6 && parts[3] === 'actuators' && /^[A-Za-z0-9_-]+$/.test(parts[4]) && parts[5] === 'status') {
    return { deviceId: parts[2], actuator: parts[4], type: 'actuator-status' };
  }

  return null;
}

function getDeviceIdFromTopic(topic) {
  return getTopicContext(topic)?.deviceId || null;
}

module.exports = {
  BASE_TOPIC,
  TOPICS,
  telemetryTopic,
  statusTopic,
  configTopic,
  actuatorStatusTopic,
  actuatorCommandTopic,
  getTopicContext,
  getDeviceIdFromTopic
};

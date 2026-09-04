function parseJsonMessage(message) {
  let data;

  try {
    data = JSON.parse(Buffer.isBuffer(message) ? message.toString('utf8') : String(message));
  } catch (_error) {
    throw new Error('El mensaje MQTT no contiene un JSON válido');
  }

  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('El mensaje MQTT debe ser un objeto JSON');
  }

  return data;
}

function parseNonNegativeNumber(data, property) {
  if (!Number.isFinite(data[property]) || data[property] < 0) {
    throw new Error(`${property} es obligatorio, numérico y no puede ser negativo`);
  }

  return data[property];
}

function parseOptionalNumber(data, property, { min = 0, max = Infinity } = {}) {
  if (data[property] === undefined || data[property] === null) return null;
  if (!Number.isFinite(data[property]) || data[property] < min || data[property] > max) {
    throw new Error(`${property} debe ser numérico y estar entre ${min} y ${max}`);
  }

  return data[property];
}

function parseOptionalInteger(data, property, { min = 0, max = Infinity } = {}) {
  const value = parseOptionalNumber(data, property, { min, max });
  if (value !== null && !Number.isInteger(value)) {
    throw new Error(`${property} debe ser un entero entre ${min} y ${max}`);
  }

  return value;
}

function rssiToSignalQuality(rssiDbm) {
  return Math.max(0, Math.min(100, 2 * (rssiDbm + 100)));
}

function parseSignalMetrics(data) {
  let wifiRssiDbm = parseOptionalInteger(data, 'wifiRssiDbm', { min: -127, max: 0 });
  let signalQuality = parseOptionalInteger(data, 'signalQualityPercent', { min: 0, max: 100 });

  if (data.signalQuality !== undefined && data.signalQuality !== null) {
    if (!Number.isInteger(data.signalQuality)) {
      throw new Error('signalQuality debe ser un entero RSSI (-127 a 0) o porcentaje (0 a 100)');
    }

    if (data.signalQuality < 0) {
      if (data.signalQuality < -127) {
        throw new Error('signalQuality RSSI debe estar entre -127 y 0 dBm');
      }
      if (wifiRssiDbm !== null && wifiRssiDbm !== data.signalQuality) {
        throw new Error('wifiRssiDbm y signalQuality no coinciden');
      }
      wifiRssiDbm = data.signalQuality;
    } else if (data.signalQuality <= 100) {
      if (signalQuality !== null && signalQuality !== data.signalQuality) {
        throw new Error('signalQuality y signalQualityPercent no coinciden');
      }
      signalQuality = data.signalQuality;
    } else {
      throw new Error('signalQuality porcentaje debe estar entre 0 y 100');
    }
  }

  if (wifiRssiDbm !== null && signalQuality === null) {
    signalQuality = rssiToSignalQuality(wifiRssiDbm);
  }

  return { wifiRssiDbm, signalQuality };
}

function parseTimestamp(value) {
  if (value === undefined || value === null || value === '') {
    return new Date().toISOString();
  }

  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    throw new Error('timestamp debe ser una fecha ISO válida');
  }

  return new Date(value).toISOString();
}

function parseOptionalDeviceId(data) {
  if (data.deviceId === undefined || data.deviceId === null) return null;
  if (typeof data.deviceId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(data.deviceId)) {
    throw new Error('deviceId debe contener solo letras, números, guiones o guiones bajos');
  }

  return data.deviceId;
}

function parseTelemetryMessage(message) {
  const data = parseJsonMessage(message);
  const signalMetrics = parseSignalMetrics(data);

  return {
    flowRateLpm: parseNonNegativeNumber(data, 'flowRateLpm'),
    consumptionLiters: parseNonNegativeNumber(data, 'consumptionLiters'),
    totalLiters: parseOptionalNumber(data, 'totalLiters'),
    pulses: parseOptionalInteger(data, 'pulses'),
    sampleIntervalSeconds: parseOptionalNumber(data, 'sampleIntervalSeconds', {
      min: 0.001,
      max: 3600
    }),
    ...signalMetrics,
    batteryLevel: parseOptionalInteger(data, 'batteryLevel', { min: 0, max: 100 }),
    voltage: parseOptionalNumber(data, 'voltage', { min: 0, max: 60 }),
    temperature: parseOptionalNumber(data, 'temperature', { min: -55, max: 125 }),
    timestamp: parseTimestamp(data.timestamp),
    reportedDeviceId: parseOptionalDeviceId(data)
  };
}

function parseDeviceStatusMessage(message) {
  const data = parseJsonMessage(message);
  const status = typeof data.status === 'string' ? data.status.trim().toUpperCase() : '';

  if (!['ONLINE', 'OFFLINE', 'ERROR'].includes(status)) {
    throw new Error('status debe ser ONLINE, OFFLINE o ERROR');
  }

  return {
    status,
    timestamp: parseTimestamp(data.timestamp),
    reportedDeviceId: parseOptionalDeviceId(data)
  };
}

function parseActuatorStatusMessage(message) {
  const data = parseJsonMessage(message);
  const actuator = typeof data.actuator === 'string' ? data.actuator.trim().toUpperCase() : '';
  const status = typeof data.status === 'string' ? data.status.trim().toUpperCase() : '';

  if (!['VALVE', 'PUMP'].includes(actuator)) {
    throw new Error('actuator debe ser VALVE o PUMP');
  }

  const validStatuses = actuator === 'VALVE' ? ['OPEN', 'CLOSED'] : ['ON', 'OFF'];
  if (!validStatuses.includes(status)) {
    throw new Error(`status no es válido para ${actuator}`);
  }

  return {
    actuator,
    status,
    timestamp: parseTimestamp(data.timestamp),
    reportedDeviceId: parseOptionalDeviceId(data)
  };
}

module.exports = {
  parseTelemetryMessage,
  parseDeviceStatusMessage,
  parseActuatorStatusMessage,
  rssiToSignalQuality
};

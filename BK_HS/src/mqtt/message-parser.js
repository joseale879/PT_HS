const DEFAULT_MAX_PAYLOAD_BYTES = 16 * 1024;

function parseJsonMessage(message, maxPayloadBytes = DEFAULT_MAX_PAYLOAD_BYTES) {
  const buffer = Buffer.isBuffer(message) ? message : Buffer.from(String(message));
  if (buffer.byteLength > maxPayloadBytes) {
    throw new Error(`El payload MQTT supera el maximo de ${maxPayloadBytes} bytes`);
  }

  let data;

  try {
    data = JSON.parse(buffer.toString('utf8'));
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

  const isoWithTimezone = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/i;
  if (typeof value !== 'string' || !isoWithTimezone.test(value) || Number.isNaN(Date.parse(value))) {
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

function parseOptionalHardwareId(data) {
  const value = data.hardwareId;
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(value)) {
    throw new Error('hardwareId debe contener entre 3 y 32 caracteres seguros');
  }
  return value;
}

function parseOptionalWifiSsid(data) {
  const value = data.wifiSsid ?? data.ssid;
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length > 32) {
    throw new Error('wifiSsid debe tener como máximo 32 caracteres');
  }
  return value.trim() || null;
}

function parseOptionalProvisioningStatus(data) {
  const value = data.provisioningStatus ?? data.provisioningState;
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('provisioningStatus no es valido');
  const normalized = value.trim().toUpperCase();
  if (!['PENDING', 'BLE_READY', 'WIFI_CONNECTED', 'MQTT_CONNECTED', 'COMPLETE', 'FAILED'].includes(normalized)) {
    throw new Error('provisioningStatus no es valido');
  }
  return normalized;
}

function parseOptionalMessageId(data) {
  const value = data.mqttMessageId ?? data.messageId;
  if (value === undefined || value === null || value === '') return null;
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^[A-Za-z0-9._:-]{1,100}$/.test(String(value))) {
    throw new Error('mqttMessageId debe contener entre 1 y 100 caracteres seguros');
  }
  return String(value);
}

function parseOptionalCorrelationId(data) {
  const value = data.correlationId;
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('correlationId debe ser un UUID válido');
  }
  return value;
}

function parseTelemetryMessage(message, { maxPayloadBytes } = {}) {
  const data = parseJsonMessage(message, maxPayloadBytes);
  const signalMetrics = parseSignalMetrics(data);

  return {
    mqttMessageId: parseOptionalMessageId(data),
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
    reportedDeviceId: parseOptionalDeviceId(data),
    hardwareId: parseOptionalHardwareId(data)
  };
}

function parseDeviceStatusMessage(message, { maxPayloadBytes } = {}) {
  const data = parseJsonMessage(message, maxPayloadBytes);
  const status = typeof data.status === 'string' ? data.status.trim().toUpperCase() : '';

  if (!['ONLINE', 'OFFLINE', 'ERROR'].includes(status)) {
    throw new Error('status debe ser ONLINE, OFFLINE o ERROR');
  }

  return {
    status,
    timestamp: parseTimestamp(data.timestamp),
    firmwareVersion: data.firmwareVersion === undefined || data.firmwareVersion === null ? null : String(data.firmwareVersion).trim(),
    wifiRssiDbm: parseOptionalInteger(data, 'wifiRssiDbm', { min: -127, max: 0 }),
    signalQuality: parseOptionalInteger(data, 'signalQuality', { min: 0, max: 100 }),
    batteryLevel: parseOptionalInteger(data, 'batteryLevel', { min: 0, max: 100 }),
    lastIp: data.lastIp === undefined || data.lastIp === null ? null : String(data.lastIp).trim(),
    wifiSsid: parseOptionalWifiSsid(data),
    reportedDeviceId: parseOptionalDeviceId(data),
    hardwareId: parseOptionalHardwareId(data),
    provisioningStatus: parseOptionalProvisioningStatus(data)
  };
}

function parseActuatorStatusMessage(message, { maxPayloadBytes } = {}) {
  const data = parseJsonMessage(message, maxPayloadBytes);
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
    correlationId: parseOptionalCorrelationId(data),
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

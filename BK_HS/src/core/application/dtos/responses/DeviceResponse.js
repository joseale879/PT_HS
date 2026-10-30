const DEVICE_ONLINE_MAX_AGE_MS = 60_000;
const DEVICE_CLOCK_FUTURE_TOLERANCE_MS = 5 * 60_000;

function effectiveConnectivityStatus(device, now = Date.now()) {
  const reportedStatus = String(device?.connectivityStatus || 'UNKNOWN').toUpperCase();
  if (reportedStatus !== 'ONLINE') return reportedStatus;

  const lastSeenAt = device?.lastConnectionAt instanceof Date
    ? device.lastConnectionAt.getTime()
    : Date.parse(device?.lastConnectionAt || '');
  if (!Number.isFinite(lastSeenAt)) return 'OFFLINE';

  const ageMs = now - lastSeenAt;
  if (
    ageMs > DEVICE_ONLINE_MAX_AGE_MS ||
    ageMs < -DEVICE_CLOCK_FUTURE_TOLERANCE_MS
  ) {
    return 'OFFLINE';
  }
  return 'ONLINE';
}

class DeviceResponse {
  static fromEntity(device) {
    return {
      deviceId: device.id,
      code: device.code,
      name: device.name,
      type: device.type,
      hardwareId: device.hardwareId,
      location: device.location,
      manufacturer: device.manufacturer,
      model: device.model,
      alertThreshold: device.alertThreshold,
      status: device.status,
      connectivityStatus: effectiveConnectivityStatus(device),
      firmwareVersion: device.firmwareVersion,
      lastConnectionAt: device.lastConnectionAt,
      lastIp: device.lastIp,
      wifiSsid: device.wifiSsid,
      wifiRssiDbm: device.wifiRssiDbm,
      signalQuality: device.signalQuality,
      batteryLevel: device.batteryLevel,
      measurementEnabled: device.measurementEnabled,
      measurementUpdatedAt: device.measurementUpdatedAt,
      provisioningStatus: device.provisioningStatus,
      provisioningError: device.provisioningError,
      provisioningUpdatedAt: device.provisioningUpdatedAt,
      provisionedAt: device.provisionedAt
    };
  }
}

module.exports = { DeviceResponse, effectiveConnectivityStatus };

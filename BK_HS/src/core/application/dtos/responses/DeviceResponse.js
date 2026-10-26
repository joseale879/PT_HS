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
      connectivityStatus: device.connectivityStatus,
      firmwareVersion: device.firmwareVersion,
      lastConnectionAt: device.lastConnectionAt,
      lastIp: device.lastIp,
      wifiSsid: device.wifiSsid,
      wifiRssiDbm: device.wifiRssiDbm,
      signalQuality: device.signalQuality,
      batteryLevel: device.batteryLevel,
      provisioningStatus: device.provisioningStatus,
      provisioningError: device.provisioningError,
      provisioningUpdatedAt: device.provisioningUpdatedAt,
      provisionedAt: device.provisionedAt
    };
  }
}

module.exports = { DeviceResponse };

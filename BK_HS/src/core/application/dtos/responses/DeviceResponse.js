class DeviceResponse {
  static fromEntity(device) {
    return {
      deviceId: device.id,
      code: device.code,
      name: device.name,
      type: device.type,
      location: device.location,
      manufacturer: device.manufacturer,
      model: device.model,
      alertThreshold: device.alertThreshold,
      status: device.status,
      connectivityStatus: device.connectivityStatus,
      firmwareVersion: device.firmwareVersion,
      lastConnectionAt: device.lastConnectionAt,
      wifiRssiDbm: device.wifiRssiDbm,
      signalQuality: device.signalQuality,
      batteryLevel: device.batteryLevel
    };
  }
}

module.exports = { DeviceResponse };

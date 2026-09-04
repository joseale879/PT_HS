class DeviceResponse {
  static fromEntity(device) {
    return {
      deviceId: device.id,
      code: device.code,
      name: device.name,
      type: device.type,
      manufacturer: device.manufacturer,
      model: device.model,
      alertThreshold: device.alertThreshold,
      status: device.status,
      firmwareVersion: device.firmwareVersion,
      lastConnectionAt: device.lastConnectionAt
    };
  }
}

module.exports = { DeviceResponse };

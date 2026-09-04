class DeactivateDevice {
  constructor({ updateDeviceStatus }) {
    this.updateDeviceStatus = updateDeviceStatus;
  }

  execute({ userId, deviceId, reason }) {
    return this.updateDeviceStatus.execute({
      userId,
      deviceId,
      status: 'Suspended',
      reason
    });
  }
}

module.exports = { DeactivateDevice };

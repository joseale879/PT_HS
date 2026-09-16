class DeviceRepository {
  async register() { throw new Error('DeviceRepository.register no implementado'); }

  async linkToHome() { throw new Error('DeviceRepository.linkToHome no implementado'); }

  async findByUserId() { throw new Error('DeviceRepository.findByUserId no implementado'); }

  async findByIdForUser() { throw new Error('DeviceRepository.findByIdForUser no implementado'); }

  async findByHardwareIdForUser() { throw new Error('DeviceRepository.findByHardwareIdForUser no implementado'); }

  async claimHardwareForUser() { throw new Error('DeviceRepository.claimHardwareForUser no implementado'); }

  async findLatestTelemetryForUser() { throw new Error('DeviceRepository.findLatestTelemetryForUser no implementado'); }

  async listTelemetryForUser() { throw new Error('DeviceRepository.listTelemetryForUser no implementado'); }

  async updateForUser() { throw new Error('DeviceRepository.updateForUser no implementado'); }

  async updateConfigForUser() { throw new Error('DeviceRepository.updateConfigForUser no implementado'); }

  async updateStatusForUser() { throw new Error('DeviceRepository.updateStatusForUser no implementado'); }

  async updateProvisioningForUser() { throw new Error('DeviceRepository.updateProvisioningForUser no implementado'); }

  async unlinkFromHome() { throw new Error('DeviceRepository.unlinkFromHome no implementado'); }
}

module.exports = { DeviceRepository };

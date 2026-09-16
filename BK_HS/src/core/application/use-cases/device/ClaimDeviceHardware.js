const { Device } = require('../../../domain/entities/Device');

class ClaimDeviceHardware {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, hardwareId }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es valido');

    const normalizedHardwareId = this.normalizeHardwareId(hardwareId);
    if (!normalizedHardwareId) this.badRequest('hardwareId es obligatorio');

    const device = await this.deviceRepository.claimHardwareForUser({
      userId,
      deviceId,
      hardwareId: normalizedHardwareId,
    });
    if (!device) {
      const error = new Error('Dispositivo no encontrado');
      error.status = 404;
      throw error;
    }
    return device;
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }

  normalizeHardwareId(value) {
    try {
      return Device.optionalHardwareId(value);
    } catch (error) {
      this.badRequest(error.message);
    }
  }
}

module.exports = { ClaimDeviceHardware };

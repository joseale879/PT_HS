const { Device } = require('../../../domain/entities/Device');

class GetDeviceByHardware {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, hardwareId }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    const normalizedHardwareId = this.normalizeHardwareId(hardwareId);
    if (!normalizedHardwareId) this.badRequest('hardwareId es obligatorio');

    const device = await this.deviceRepository.findByHardwareIdForUser(
      normalizedHardwareId,
      userId
    );
    if (!device) {
      const error = new Error('No existe un dispositivo accesible con ese hardwareId');
      error.status = 404;
      throw error;
    }
    return device;
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

module.exports = { GetDeviceByHardware };

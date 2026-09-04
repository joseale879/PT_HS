const { Device } = require('../../../domain/entities/Device');

class RegisterDevice {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, homeId, code, name, type, manufacturer, model, alertThreshold }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) {
      const error = new Error('homeId no es válido');
      error.status = 400;
      throw error;
    }
    const device = Device.create({ code, name, type, manufacturer, model, alertThreshold });
    return this.deviceRepository.register(device, userId, homeId);
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}

module.exports = { RegisterDevice };

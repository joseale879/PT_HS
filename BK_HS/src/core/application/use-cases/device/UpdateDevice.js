const { Device } = require('../../../domain/entities/Device');

class UpdateDevice {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, name, manufacturer, model, alertThreshold }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es válido');

    const hasChanges = [name, manufacturer, model, alertThreshold].some((value) => value !== undefined);
    if (!hasChanges) this.badRequest('Debe enviar al menos un campo para actualizar');

    const attributes = {};
    if (name !== undefined) attributes.name = Device.validateText(name, 'name', 1, 100);
    if (manufacturer !== undefined) attributes.manufacturer = Device.optionalText(manufacturer, 'manufacturer', 100);
    if (model !== undefined) attributes.model = Device.optionalText(model, 'model', 100);
    if (alertThreshold !== undefined) attributes.alertThreshold = Device.validatePositive(alertThreshold, 'alertThreshold');

    const device = await this.deviceRepository.updateForUser({ userId, deviceId, ...attributes });
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
}

module.exports = { UpdateDevice };

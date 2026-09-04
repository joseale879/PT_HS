class UpdateDeviceConfig {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, calibrationFactor, calibrationOffset, reason }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es válido');
    if (calibrationFactor === undefined || calibrationOffset === undefined) {
      this.badRequest('calibrationFactor y calibrationOffset son obligatorios');
    }

    const factor = this.number(calibrationFactor, 'calibrationFactor');
    const offset = this.number(calibrationOffset, 'calibrationOffset');
    if (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 255) {
      this.badRequest('reason debe tener entre 3 y 255 caracteres');
    }

    const device = await this.deviceRepository.updateConfigForUser({
      userId,
      deviceId,
      calibrationFactor: factor,
      calibrationOffset: offset,
      reason: reason.trim()
    });
    if (!device) {
      const error = new Error('Dispositivo no encontrado');
      error.status = 404;
      throw error;
    }
    return device;
  }

  number(value, field) {
    const number = Number(value);
    if (!Number.isFinite(number)) this.badRequest(`${field} debe ser numérico`);
    return number;
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

module.exports = { UpdateDeviceConfig };

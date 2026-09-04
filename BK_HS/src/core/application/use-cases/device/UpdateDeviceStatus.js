class UpdateDeviceStatus {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, status, reason }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es válido');
    if (!['Active', 'Suspended', 'Low'].includes(status)) {
      this.badRequest('status debe ser Active, Suspended o Low');
    }
    if (status === 'Suspended' && (typeof reason !== 'string' || reason.trim().length < 3)) {
      this.badRequest('reason es obligatorio al suspender el dispositivo');
    }
    if (reason !== null && reason !== undefined && (typeof reason !== 'string' || reason.trim().length > 255)) {
      this.badRequest('reason no puede superar 255 caracteres');
    }

    const device = await this.deviceRepository.updateStatusForUser({
      userId,
      deviceId,
      status,
      reason: reason?.trim() || null
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
}

module.exports = { UpdateDeviceStatus };

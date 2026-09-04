class GetDevice {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) {
      const error = new Error('deviceId no es válido');
      error.status = 400;
      throw error;
    }

    const device = await this.deviceRepository.findByIdForUser(deviceId, userId);
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
}

module.exports = { GetDevice };

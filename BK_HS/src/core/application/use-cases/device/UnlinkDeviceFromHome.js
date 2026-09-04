class UnlinkDeviceFromHome {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, deviceId, homeId }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(deviceId)) this.badRequest('deviceId no es válido');
    if (!this.isUuid(homeId)) this.badRequest('homeId no es válido');

    const unlinked = await this.deviceRepository.unlinkFromHome({ userId, deviceId, homeId });
    if (!unlinked) {
      const error = new Error('La asociación dispositivo-hogar no fue encontrada');
      error.status = 404;
      throw error;
    }
    return unlinked;
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

module.exports = { UnlinkDeviceFromHome };

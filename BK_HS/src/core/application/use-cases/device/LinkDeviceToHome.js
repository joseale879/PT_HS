class LinkDeviceToHome {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  async execute({ userId, homeId, code }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) this.badRequest('homeId no es válido');
    if (typeof code !== 'string' || code.trim().length < 3 || code.trim().length > 100) {
      this.badRequest('code debe tener entre 3 y 100 caracteres');
    }

    const device = await this.deviceRepository.linkToHome({
      userId,
      homeId,
      code: code.trim()
    });
    if (!device) {
      const error = new Error('No existe un dispositivo activo con ese código');
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

module.exports = { LinkDeviceToHome };

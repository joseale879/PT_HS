class ListUserDevices {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  execute({ userId, homeId = null }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    if (homeId !== null && (typeof homeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(homeId))) {
      const error = new Error('homeId no es válido');
      error.status = 400;
      throw error;
    }
    return this.deviceRepository.findByUserId(userId, homeId);
  }
}

module.exports = { ListUserDevices };

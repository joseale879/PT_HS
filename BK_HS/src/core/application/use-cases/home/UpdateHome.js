const { Home } = require('../../../domain/entities/Home');

class UpdateHome {
  constructor({ homeRepository }) {
    this.homeRepository = homeRepository;
  }

  async execute({ userId, homeId, name, address, city, tier }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) this.badRequest('homeId no es válido');

    const home = new Home({ id: homeId, name, address, city, tier });
    const updated = await this.homeRepository.updateForUser(home, userId);
    if (!updated) {
      const error = new Error('Hogar no encontrado');
      error.status = 404;
      throw error;
    }
    return updated;
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

module.exports = { UpdateHome };

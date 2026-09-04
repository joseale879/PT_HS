const { Home } = require('../../../domain/entities/Home');

class CreateHome {
  constructor({ homeRepository }) {
    this.homeRepository = homeRepository;
  }

  async execute({ userId, name, address, city, tier }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');

    const home = Home.create({ name, address, city, tier });
    return this.homeRepository.createWithOwner(home, userId);
  }
}

module.exports = { CreateHome };

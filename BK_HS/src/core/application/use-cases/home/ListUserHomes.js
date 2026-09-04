class ListUserHomes {
  constructor({ homeRepository }) {
    this.homeRepository = homeRepository;
  }

  execute(userId) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    return this.homeRepository.findByUserId(userId);
  }
}

module.exports = { ListUserHomes };

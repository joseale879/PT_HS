class GetAuthorizationContext {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  execute(userId) {
    if (!userId) {
      const error = new Error('El usuario autenticado es obligatorio');
      error.status = 401;
      throw error;
    }
    return this.userRepository.getAuthorizationContext(userId);
  }
}

module.exports = { GetAuthorizationContext };

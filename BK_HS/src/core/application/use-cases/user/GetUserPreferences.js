class GetUserPreferences {
  constructor({ userRepository }) { this.userRepository = userRepository; }

  async execute(userId) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    return this.userRepository.getPreferences(userId);
  }

  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

module.exports = { GetUserPreferences };

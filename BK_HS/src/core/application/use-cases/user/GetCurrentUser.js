class GetCurrentUser {
  constructor({ userRepository }) { this.userRepository = userRepository; }
  async execute(userId) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    const user = await this.userRepository.findById(userId);
    if (!user) throw this.error('Usuario no encontrado', 404);
    return user;
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}
module.exports = { GetCurrentUser };

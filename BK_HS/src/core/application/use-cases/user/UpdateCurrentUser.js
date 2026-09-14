class UpdateCurrentUser {
  constructor({ userRepository, notificationService, logger = console }) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.logger = logger;
  }
  async execute({ userId, fullName, phone, city }) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    if (typeof fullName !== 'string' || fullName.trim().length < 2) throw this.error('fullName debe tener al menos 2 caracteres', 400);
    if (phone !== null && phone !== undefined && typeof phone !== 'string') throw this.error('phone no es válido', 400);
    if (city !== null && city !== undefined && typeof city !== 'string') throw this.error('city no es válida', 400);
    const user = await this.userRepository.updateProfile({ userId, fullName: fullName.trim(), phone: phone?.trim() || null, city: city?.trim() || null });
    if (!user) throw this.error('Usuario no encontrado', 404);
    await this.notifySensitiveDataChanged(user);
    return user;
  }
  async notifySensitiveDataChanged(user) {
    if (!user?.email || !this.notificationService?.isConfigured?.()) return;
    try {
      await this.notificationService.sendSensitiveDataChanged({ recipient: user.email, name: user.fullName || user.username });
    } catch (error) {
      this.logger.error('[USER] No se pudo enviar la notificación de cambio de cuenta:', error.message);
    }
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}
module.exports = { UpdateCurrentUser };

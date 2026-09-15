class UpdateCurrentUser {
  constructor({ userRepository, notificationService, logger = console }) {
    this.userRepository = userRepository;
    this.notificationService = notificationService;
    this.logger = logger;
  }
  async execute({ userId, fullName, phone, city, avatarDataUrl }) {
    if (!userId) throw this.error('El usuario autenticado es obligatorio', 400);
    if (typeof fullName !== 'string' || fullName.trim().length < 2) throw this.error('fullName debe tener al menos 2 caracteres', 400);
    if (phone !== null && phone !== undefined && typeof phone !== 'string') throw this.error('phone no es válido', 400);
    if (city !== null && city !== undefined && typeof city !== 'string') throw this.error('city no es válida', 400);
    if (typeof phone === 'string' && phone.trim().length > 60) throw this.error('El teléfono no puede superar 60 caracteres', 400);
    const normalizedAvatar = this.normalizeAvatar(avatarDataUrl);
    const user = await this.userRepository.updateProfile({
      userId,
      fullName: fullName.trim(),
      phone: phone === undefined ? undefined : phone?.trim() || null,
      city: city === undefined ? undefined : city?.trim() || null,
      avatarDataUrl: normalizedAvatar
    });
    if (!user) throw this.error('Usuario no encontrado', 404);
    await this.notifySensitiveDataChanged(user);
    return user;
  }
  normalizeAvatar(value) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    if (typeof value !== 'string') throw this.error('La foto de perfil no es válida', 400);
    const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match || match[2].length % 4 !== 0) throw this.error('La foto debe ser JPG, PNG o WebP', 400);
    if (Buffer.from(match[2], 'base64').byteLength > 2 * 1024 * 1024) {
      throw this.error('La foto no puede superar 2 MB', 400);
    }
    return value;
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

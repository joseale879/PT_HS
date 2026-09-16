const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');

class ChangePassword {
  constructor({ authRepository, passwordHasher, notificationService, logger = console }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ userId, currentPassword, newPassword }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    if (typeof currentPassword !== 'string' || !currentPassword) this.badRequest('currentPassword es obligatorio');
    const policyRow = this.authRepository.getActivePasswordPolicy
      ? await this.authRepository.getActivePasswordPolicy()
      : null;
    PasswordPolicy.validate(newPassword, 'newPassword', policyRow ? PasswordPolicy.fromDatabase(policyRow) : PasswordPolicy.DEFAULT);
    if (currentPassword === newPassword) this.badRequest('La nueva contraseña debe ser diferente');

    const credentials = await this.authRepository.findCredentialsForUser(userId);
    const valid = credentials && credentials.accountStatus === 'Active'
      ? await this.passwordHasher.compare(currentPassword, credentials.passwordHash)
      : false;
    if (!valid) {
      const error = new Error('La contraseña actual no es válida');
      error.status = 401;
      throw error;
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    await this.authRepository.changePasswordHash({ userId, passwordHash });
    await this.notifyPasswordChanged(userId);
  }

  async notifyPasswordChanged(userId) {
    if (!this.notificationService?.isConfigured?.() || !this.authRepository.findNotificationProfile) return;
    try {
      const profile = await this.authRepository.findNotificationProfile(userId);
      if (profile?.recipient) await this.notificationService.sendPasswordChanged(profile);
    } catch (error) {
      this.logger.error('[AUTH] No se pudo enviar el correo de cambio de contraseña:', error.message);
    }
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { ChangePassword };

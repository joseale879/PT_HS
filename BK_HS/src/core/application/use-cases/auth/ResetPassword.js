const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');

class ResetPassword {
  constructor({ authRepository, passwordHasher, tokenService, notificationService, logger = console }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ resetToken, newPassword }) {
    if (typeof resetToken !== 'string' || resetToken.length < 40 || resetToken.length > 200) {
      this.badRequest('resetToken es obligatorio y no es válido');
    }
    const policyRow = this.authRepository.getActivePasswordPolicy
      ? await this.authRepository.getActivePasswordPolicy()
      : null;
    PasswordPolicy.validate(newPassword, 'newPassword', policyRow ? PasswordPolicy.fromDatabase(policyRow) : PasswordPolicy.DEFAULT);
    const userId = await this.authRepository.consumePasswordReset({
      tokenHash: this.tokenService.hash(resetToken),
      passwordHash: await this.passwordHasher.hash(newPassword)
    });
    if (!userId) {
      const error = new Error('El token de recuperación no es válido o expiró');
      error.status = 401;
      throw error;
    }
    await this.notifyPasswordChanged(userId);
    return { userId };
  }

  async notifyPasswordChanged(userId) {
    if (!this.notificationService?.isConfigured?.() || !this.authRepository.findNotificationProfile) return;
    try {
      const profile = await this.authRepository.findNotificationProfile(userId);
      if (profile?.recipient) await this.notificationService.sendPasswordChanged(profile);
    } catch (error) {
      this.logger.error('[AUTH] No se pudo enviar el correo posterior a recuperación:', error.message);
    }
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { ResetPassword };

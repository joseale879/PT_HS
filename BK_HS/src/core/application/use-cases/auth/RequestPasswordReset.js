const { isValidEmail } = require('../../../../shared/validation');

class RequestPasswordReset {
  constructor({ authRepository, tokenService, notificationService }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
  }

  async execute({ email }) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!isValidEmail(normalizedEmail)) {
      this.badRequest('El correo electrónico es obligatorio y debe ser válido');
    }
    if (!this.notificationService.isConfigured()) {
      const error = new Error('El correo de recuperación no está configurado');
      error.status = 503;
      throw error;
    }
    const resetToken = this.tokenService.generate();
    const resetExpiresAt = this.tokenService.expiresAt();
    const resetId = await this.authRepository.createPasswordResetToken({
      login: normalizedEmail,
      tokenHash: this.tokenService.hash(resetToken),
      expiresAt: resetExpiresAt
    });
    if (resetId) await this.notificationService.sendPasswordReset({ recipient: normalizedEmail, resetToken });
    return { resetExpiresAt };
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { RequestPasswordReset };

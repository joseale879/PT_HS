class ResendEmailVerification {
  constructor({ authRepository, tokenService, notificationService, logger = console }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ email }) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 150) {
      const error = new Error('El correo electrónico es obligatorio y debe ser válido');
      error.status = 400;
      throw error;
    }
    const token = this.tokenService.generate();
    const verificationId = await this.authRepository.createEmailVerificationToken({
      login: normalizedEmail,
      tokenHash: this.tokenService.hash(token),
      expiresAt: this.tokenService.expiresAt(24)
    });
    if (verificationId && this.notificationService.isConfigured()) {
      try {
        await this.notificationService.sendEmailVerification({ recipient: normalizedEmail, token });
      } catch (error) {
        this.logger.error('[AUTH] No se pudo enviar el correo de verificación:', error.message);
      }
    }
    return { accepted: true };
  }
}

module.exports = { ResendEmailVerification };

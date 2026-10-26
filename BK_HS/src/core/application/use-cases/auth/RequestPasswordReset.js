class RequestPasswordReset {
  constructor({ authRepository, tokenService, notificationService, logger = console }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ email }) {
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 150) {
      this.badRequest('El correo electrónico es obligatorio y debe ser válido');
    }

    const resetToken = this.tokenService.generate();
    const resetExpiresAt = this.tokenService.expiresAt();
    const resetId = await this.authRepository.createPasswordResetToken({
      login: normalizedEmail,
      tokenHash: this.tokenService.hash(resetToken),
      expiresAt: resetExpiresAt
    });

    // La respuesta pública es siempre neutral. Un fallo SMTP nunca revela
    // si el correo pertenece a una cuenta ni convierte el flujo en 500.
    if (resetId && this.notificationService.isConfigured()) {
      try {
        await this.notificationService.sendPasswordReset({ recipient: normalizedEmail, resetToken });
      } catch (error) {
        this.logger.error('[AUTH] No se pudo enviar el correo de recuperación:', error.message);
      }
    }
    return { resetExpiresAt };
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { RequestPasswordReset };

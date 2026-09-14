class GetPasswordResetContext {
  constructor({ authRepository, tokenService }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
  }

  async execute({ resetToken }) {
    if (typeof resetToken !== 'string' || resetToken.length < 40 || resetToken.length > 200) {
      this.invalidToken();
    }
    const email = await this.authRepository.findPasswordResetEmail({
      tokenHash: this.tokenService.hash(resetToken)
    });
    if (!email) this.invalidToken();
    return { email };
  }

  invalidToken() {
    const error = new Error('El enlace de recuperación no es válido o expiró');
    error.status = 401;
    throw error;
  }
}

module.exports = { GetPasswordResetContext };

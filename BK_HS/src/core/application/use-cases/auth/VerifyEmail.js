class VerifyEmail {
  constructor({ authRepository, tokenService }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
  }

  async execute({ token }) {
    if (typeof token !== 'string' || token.length < 40 || token.length > 200) {
      const error = new Error('El token de verificación no es válido');
      error.status = 400;
      throw error;
    }
    const userId = await this.authRepository.consumeEmailVerification({
      tokenHash: this.tokenService.hash(token)
    });
    if (!userId) {
      const error = new Error('El token de verificación no es válido o expiró');
      error.status = 400;
      throw error;
    }
    return { userId };
  }
}

module.exports = { VerifyEmail };

class AuthRepository {
  async register() { throw new Error('AuthRepository.register no implementado'); }

  async findCredentials() { throw new Error('AuthRepository.findCredentials no implementado'); }

  async recordLoginFailure() { throw new Error('AuthRepository.recordLoginFailure no implementado'); }

  async resetLoginAttempts() { throw new Error('AuthRepository.resetLoginAttempts no implementado'); }

  async createSession() { throw new Error('AuthRepository.createSession no implementado'); }

  async rotateRefreshToken() { throw new Error('AuthRepository.rotateRefreshToken no implementado'); }

  async revokeRefreshSession() { throw new Error('AuthRepository.revokeRefreshSession no implementado'); }

  async findCredentialsForUser() { throw new Error('AuthRepository.findCredentialsForUser no implementado'); }

  async changePasswordHash() { throw new Error('AuthRepository.changePasswordHash no implementado'); }

  async createPasswordResetToken() { throw new Error('AuthRepository.createPasswordResetToken no implementado'); }

  async consumePasswordReset() { throw new Error('AuthRepository.consumePasswordReset no implementado'); }

  async findPasswordResetEmail() { throw new Error('AuthRepository.findPasswordResetEmail no implementado'); }
}

module.exports = { AuthRepository };

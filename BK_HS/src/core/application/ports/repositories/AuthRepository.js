class AuthRepository {
  async register() { throw new Error('AuthRepository.register no implementado'); }

  async findCredentials() { throw new Error('AuthRepository.findCredentials no implementado'); }

  async recordLoginFailure() { throw new Error('AuthRepository.recordLoginFailure no implementado'); }

  async resetLoginAttempts() { throw new Error('AuthRepository.resetLoginAttempts no implementado'); }

  async createSession() { throw new Error('AuthRepository.createSession no implementado'); }

  async rotateRefreshToken() { throw new Error('AuthRepository.rotateRefreshToken no implementado'); }

  async revokeRefreshSession() { throw new Error('AuthRepository.revokeRefreshSession no implementado'); }

  async listSessions() { throw new Error('AuthRepository.listSessions no implementado'); }

  async revokeSession() { throw new Error('AuthRepository.revokeSession no implementado'); }

  async revokeOtherSessions() { throw new Error('AuthRepository.revokeOtherSessions no implementado'); }

  async revokeAllSessions() { throw new Error('AuthRepository.revokeAllSessions no implementado'); }

  async findCredentialsForUser() { throw new Error('AuthRepository.findCredentialsForUser no implementado'); }

  async findNotificationProfile() { throw new Error('AuthRepository.findNotificationProfile no implementado'); }

  async changePasswordHash() { throw new Error('AuthRepository.changePasswordHash no implementado'); }

  async createPasswordResetToken() { throw new Error('AuthRepository.createPasswordResetToken no implementado'); }

  async findPasswordResetEmail() { throw new Error('AuthRepository.findPasswordResetEmail no implementado'); }

  async consumePasswordReset() { throw new Error('AuthRepository.consumePasswordReset no implementado'); }

  async createEmailVerificationToken() { throw new Error('AuthRepository.createEmailVerificationToken no implementado'); }

  async consumeEmailVerification() { throw new Error('AuthRepository.consumeEmailVerification no implementado'); }
}

module.exports = { AuthRepository };

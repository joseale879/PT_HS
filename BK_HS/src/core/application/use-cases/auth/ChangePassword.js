const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');

class ChangePassword {
  constructor({ authRepository, passwordHasher }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
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
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { ChangePassword };

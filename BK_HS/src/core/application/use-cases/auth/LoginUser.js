class LoginUser {
  constructor({ authRepository, passwordHasher }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ login, password, sourceIp = null }) {
    if (typeof login !== 'string' || !login.trim() || typeof password !== 'string' || !password) {
      const error = new Error('login y password son obligatorios');
      error.status = 400;
      throw error;
    }

    const account = await this.authRepository.findCredentials(login.trim());
    const security = account && this.authRepository.getLoginSecurityState
      ? await this.authRepository.getLoginSecurityState(account.user_account_id)
      : null;
    if (security?.blockedUntil && new Date(security.blockedUntil).getTime() > Date.now()) {
      const error = new Error('La cuenta está temporalmente bloqueada');
      error.status = 401;
      throw error;
    }
    const passwordExpired = security?.passwordChangedAt && security?.expirationDays > 0
      && new Date(security.passwordChangedAt).getTime() + security.expirationDays * 86400000 <= Date.now();
    if (security?.requiresChange || passwordExpired) {
      const error = new Error('La contraseña debe cambiarse antes de iniciar sesión');
      error.status = 403;
      throw error;
    }
    const valid = account && account.account_status === 'Active'
      ? await this.passwordHasher.compare(password, account.password_hash)
      : false;

    if (!valid) {
      if (account) await this.authRepository.recordLoginFailure(account.user_account_id, sourceIp);
      const error = new Error('Credenciales inválidas');
      error.status = 401;
      throw error;
    }

    await this.authRepository.resetLoginAttempts(account.user_account_id);
    return { userId: account.user_account_id };
  }
}

module.exports = { LoginUser };

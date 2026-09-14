const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');
const { isValidEmail, isValidPersonName } = require('../../../../shared/validation');

class RegisterUser {
  constructor({ authRepository, passwordHasher, tokenService, notificationService }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
  }

  async execute({ username, email, password, fullName, documentType, documentNumber }) {
    const normalizedUsername = this.required(username, 'username', 4).toLowerCase();
    const normalizedEmail = this.required(email, 'email').toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      throw this.error('El correo electrónico no tiene un formato válido');
    }
    const normalizedPassword = this.required(password, 'password', 8);
    const policyRow = this.authRepository.getActivePasswordPolicy
      ? await this.authRepository.getActivePasswordPolicy()
      : null;
    PasswordPolicy.validate(normalizedPassword, 'password', policyRow ? PasswordPolicy.fromDatabase(policyRow) : PasswordPolicy.DEFAULT);
    const normalizedFullName = this.required(fullName || normalizedUsername, 'fullName');
    if (!isValidPersonName(normalizedFullName)) {
      throw this.error('El nombre solo puede contener letras, tildes, ñ y espacios');
    }
    const normalizedDocumentType = this.documentType(documentType);
    const normalizedDocumentNumber = this.documentNumber(documentNumber);
    const passwordHash = await this.passwordHasher.hash(normalizedPassword);
    const userId = await this.authRepository.register({ username: normalizedUsername, email: normalizedEmail, fullName: normalizedFullName, documentType: normalizedDocumentType, documentNumber: normalizedDocumentNumber, passwordHash });
    const token = this.tokenService.generate();
    await this.authRepository.createEmailVerificationToken({ userId, tokenHash: this.tokenService.hash(token), expiresAt: this.tokenService.expiresAt() });
    await this.notificationService.sendEmailVerification({ recipient: normalizedEmail, verificationToken: token });
    return userId;
  }

  async verifyEmail(token) { return this.authRepository.verifyEmail({ tokenHash: this.tokenService.hash(token) }); }

  documentType(value) {
    if (value !== 'CC' && value !== 'CE') {
      const error = new Error('documentType debe ser CC o CE');
      error.status = 400;
      throw error;
    }
    return value;
  }

  documentNumber(value) {
    if (typeof value !== 'string' || !/^[0-9]{1,10}$/.test(value.trim())) {
      const error = new Error('documentNumber debe contener solo dígitos y máximo 10 caracteres');
      error.status = 400;
      throw error;
    }
    return value.trim();
  }

  required(value, field, min = 1) {
    if (typeof value !== 'string' || value.trim().length < min) {
      const error = new Error(`${field} es obligatorio`);
      error.status = 400;
      throw error;
    }
    return value.trim();
  }

  error(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = { RegisterUser };

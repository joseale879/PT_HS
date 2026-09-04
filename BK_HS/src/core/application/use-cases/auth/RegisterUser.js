const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');

class RegisterUser {
  constructor({ authRepository, passwordHasher }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute({ username, email, password, fullName, documentType, documentNumber }) {
    const normalizedUsername = this.required(username, 'username', 4).toLowerCase();
    const normalizedEmail = this.required(email, 'email').toLowerCase();
    const normalizedPassword = this.required(password, 'password', 8);
    const policyRow = this.authRepository.getActivePasswordPolicy
      ? await this.authRepository.getActivePasswordPolicy()
      : null;
    PasswordPolicy.validate(normalizedPassword, 'password', policyRow ? PasswordPolicy.fromDatabase(policyRow) : PasswordPolicy.DEFAULT);
    const normalizedFullName = this.required(fullName || normalizedUsername, 'fullName');
    const normalizedDocumentType = this.documentType(documentType);
    const normalizedDocumentNumber = this.documentNumber(documentNumber);
    const passwordHash = await this.passwordHasher.hash(normalizedPassword);
    return this.authRepository.register({ username: normalizedUsername, email: normalizedEmail, fullName: normalizedFullName, documentType: normalizedDocumentType, documentNumber: normalizedDocumentNumber, passwordHash });
  }

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
}

module.exports = { RegisterUser };

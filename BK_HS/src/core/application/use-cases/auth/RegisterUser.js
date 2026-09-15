const { PasswordPolicy } = require('../../services/auth/PasswordPolicy');

class RegisterUser {
  constructor({ authRepository, passwordHasher, tokenService, notificationService, logger = console }) {
    this.authRepository = authRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async execute({ username, email, password, fullName, documentType, documentNumber, privacyPolicyAccepted, termsAccepted, privacyPolicyVersion, termsVersion, sourceIp, userAgent }) {
    if (privacyPolicyAccepted !== true || termsAccepted !== true) {
      const error = new Error('Debes aceptar los términos y condiciones y la política de privacidad');
      error.status = 400;
      throw error;
    }
    if (privacyPolicyVersion !== '2026-09' || termsVersion !== '2026-09') {
      const error = new Error('La versión de los documentos legales no es válida');
      error.status = 400;
      throw error;
    }
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
    const userId = await this.authRepository.register({ username: normalizedUsername, email: normalizedEmail, fullName: normalizedFullName, documentType: normalizedDocumentType, documentNumber: normalizedDocumentNumber, passwordHash, privacyPolicyVersion, termsVersion, sourceIp, userAgent });

    if (this.tokenService && this.authRepository.createEmailVerificationToken) {
      const token = this.tokenService.generate();
      const verificationId = await this.authRepository.createEmailVerificationToken({
        login: normalizedEmail,
        tokenHash: this.tokenService.hash(token),
        expiresAt: this.tokenService.expiresAt(24)
      });

      if (verificationId && this.notificationService?.isConfigured?.()) {
        try {
          await this.notificationService.sendEmailVerification({ recipient: normalizedEmail, token });
        } catch (error) {
          this.logger.error('[AUTH] No se pudo enviar el correo de verificación:', error.message);
        }
      }
    }

    return userId;
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

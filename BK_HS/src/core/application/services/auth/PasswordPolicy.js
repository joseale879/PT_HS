const DEFAULT_POLICY = Object.freeze({
  minLength: 8,
  maxLength: 128,
  requiresUppercase: true,
  requiresLowercase: true,
  requiresNumber: true,
  requiresSymbol: true
});

class PasswordPolicy {
  static fromDatabase(row = {}) {
    return {
      minLength: Number(row.min_length ?? DEFAULT_POLICY.minLength),
      maxLength: Number(row.max_length ?? DEFAULT_POLICY.maxLength),
      requiresUppercase: row.requires_uppercase ?? DEFAULT_POLICY.requiresUppercase,
      requiresLowercase: row.requires_lowercase ?? DEFAULT_POLICY.requiresLowercase,
      requiresNumber: row.requires_number ?? DEFAULT_POLICY.requiresNumber,
      requiresSymbol: row.requires_symbol ?? DEFAULT_POLICY.requiresSymbol
    };
  }
  static validate(value, field = 'password', policy = DEFAULT_POLICY) {
    if (typeof value !== 'string' || value.length < policy.minLength || value.length > policy.maxLength) {
      throw PasswordPolicy.error(`${field} debe tener entre ${policy.minLength} y ${policy.maxLength} caracteres`);
    }
    const rules = [
      [policy.requiresUppercase, /[A-Z]/, 'una mayúscula'],
      [policy.requiresLowercase, /[a-z]/, 'una minúscula'],
      [policy.requiresNumber, /[0-9]/, 'un número'],
      [policy.requiresSymbol, /[^A-Za-z0-9]/, 'un símbolo']
    ];
    for (const [enabled, pattern, description] of rules) {
      if (enabled && !pattern.test(value)) throw PasswordPolicy.error(`${field} debe contener ${description}`);
    }
    return value;
  }

  static error(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

PasswordPolicy.DEFAULT = DEFAULT_POLICY;
module.exports = { PasswordPolicy };

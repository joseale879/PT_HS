const crypto = require('node:crypto');

class PasswordTokenService {
  generate() {
    return crypto.randomBytes(32).toString('base64url');
  }

  hash(value) {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
  }

  expiresAt(hours = 1) {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }
}

module.exports = { PasswordTokenService };

const test = require('node:test');
const assert = require('node:assert/strict');
const { PasswordPolicy } = require('../../src/core/application/services/auth/PasswordPolicy');

test('aplica la política completa de contraseña', () => {
  assert.doesNotThrow(() => PasswordPolicy.validate('Segura-123!', 'password'));
  assert.throws(() => PasswordPolicy.validate('soloocho', 'password'), (error) => error.status === 400);
});

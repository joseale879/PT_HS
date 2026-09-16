const test = require('node:test');
const assert = require('node:assert/strict');
const { RegisterUser } = require('../../src/core/application/use-cases/auth/RegisterUser');

const validInput = {
  username: 'usuario1',
  email: 'usuario@example.com',
  password: 'Segura#123',
  fullName: 'Usuario Hidro',
  documentType: 'CC',
  documentNumber: '1234567890',
  privacyPolicyAccepted: true,
  termsAccepted: true,
  privacyPolicyVersion: '2026-09',
  termsVersion: '2026-09',
  sourceIp: '127.0.0.1',
  userAgent: 'test'
};

test('registra la cuenta como pendiente y envía el correo de verificación', async () => {
  const calls = {};
  const useCase = new RegisterUser({
    authRepository: {
      getActivePasswordPolicy: async () => null,
      register: async (input) => {
        calls.registration = input;
        return 'user-1';
      },
      createEmailVerificationToken: async (input) => {
        calls.verification = input;
        return 'verification-1';
      }
    },
    passwordHasher: { hash: async () => 'hash' },
    tokenService: {
      generate: () => 'v'.repeat(48),
      hash: (value) => `hash:${value}`,
      expiresAt: (hours) => {
        calls.expirationHours = hours;
        return 'tomorrow';
      }
    },
    notificationService: {
      isConfigured: () => true,
      sendEmailVerification: async (input) => { calls.email = input; }
    }
  });

  assert.equal(await useCase.execute(validInput), 'user-1');
  assert.equal(calls.registration.email, validInput.email);
  assert.equal(calls.verification.login, validInput.email);
  assert.equal(calls.expirationHours, 24);
  assert.deepEqual(calls.email, { recipient: validInput.email, token: 'v'.repeat(48) });
});

test('no bloquea el registro si el SMTP local falla', async () => {
  const useCase = new RegisterUser({
    authRepository: {
      getActivePasswordPolicy: async () => null,
      register: async () => 'user-2',
      createEmailVerificationToken: async () => 'verification-2'
    },
    passwordHasher: { hash: async () => 'hash' },
    tokenService: {
      generate: () => 'v'.repeat(48),
      hash: (value) => value,
      expiresAt: () => 'tomorrow'
    },
    notificationService: {
      isConfigured: () => true,
      sendEmailVerification: async () => { throw new Error('SMTP no disponible'); }
    },
    logger: { error: () => {} }
  });

  assert.equal(await useCase.execute(validInput), 'user-2');
});

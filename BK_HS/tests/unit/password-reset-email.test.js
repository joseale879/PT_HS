const test = require('node:test');
const assert = require('node:assert/strict');
const { RequestPasswordReset } = require('../../src/core/application/use-cases/auth/RequestPasswordReset');
const { SmtpEmailSender } = require('../../src/core/infrastructure/notifications/SmtpEmailSender');
const { NotificationService } = require('../../src/core/application/services/notifications/NotificationService');

test('solicita recuperación solo con un correo electrónico válido', async () => {
  const calls = [];
  const useCase = new RequestPasswordReset({
    authRepository: {
      createPasswordResetToken: async (input) => {
        calls.push(input);
        return 'reset-id';
      }
    },
    tokenService: {
      generate: () => 'a'.repeat(43),
      hash: () => 'b'.repeat(64),
      expiresAt: () => new Date('2026-01-01T01:00:00.000Z')
    },
    notificationService: {
      isConfigured: () => true,
      sendPasswordReset: async (input) => calls.push(input)
    }
  });

  await useCase.execute({ email: '  Usuario@Ejemplo.com ' });
  assert.equal(calls[0].login, 'usuario@ejemplo.com');
  assert.deepEqual(calls[1], { recipient: 'usuario@ejemplo.com', resetToken: 'a'.repeat(43) });
  await assert.rejects(() => useCase.execute({ email: 'usuario-invalido' }), (error) => error.status === 400);
});

test('mantiene una respuesta neutra para cuentas inexistentes y no intenta enviar un correo', async () => {
  let sent = false;
  const useCase = new RequestPasswordReset({
    authRepository: { createPasswordResetToken: async () => null },
    tokenService: { generate: () => 'a'.repeat(43), hash: () => 'b'.repeat(64), expiresAt: () => new Date() },
    notificationService: { isConfigured: () => true, sendPasswordReset: async () => { sent = true; } }
  });

  const result = await useCase.execute({ email: 'noexiste@ejemplo.com' });
  assert.ok(result.resetExpiresAt);
  assert.equal(sent, false);
});

test('construye un enlace de recuperación seguro para el frontend', async () => {
  const sent = [];
  const sender = new SmtpEmailSender({
    smtp: { host: 'localhost', port: 1025, secure: false, user: '', password: '', from: 'HidroSmart <no-reply@localhost>' },
    passwordResetUrl: 'http://localhost:5173/?from=email',
    transportFactory: () => ({ sendMail: async (message) => sent.push(message), verify: async () => true })
  });

  const notifications = new NotificationService({ sender, frontendUrl: 'http://localhost:5173', passwordResetUrl: 'http://localhost:5173/?from=email' });
  await notifications.sendPasswordReset({ recipient: 'usuario@ejemplo.com', resetToken: 'token_seguro' });
  assert.equal(sent[0].to, 'usuario@ejemplo.com');
  assert.match(sent[0].text, /from=email/);
  assert.match(sent[0].text, /resetToken=token_seguro/);
});

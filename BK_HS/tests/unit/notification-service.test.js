const test = require('node:test');
const assert = require('node:assert/strict');
const { NotificationService } = require('../../src/core/application/services/notifications/NotificationService');

test('genera notificaciones de cuenta y escapa datos en HTML', async () => {
  const sent = [];
  const service = new NotificationService({
    sender: { isConfigured: () => true, send: async (message) => { sent.push(message); return { messageId: 'id-1' }; } },
    frontendUrl: 'http://localhost:5173',
    passwordResetUrl: 'http://localhost:5173'
  });

  await service.sendWelcome({ recipient: 'user@example.com', name: '<Usuario>' });
  await service.sendPasswordChanged({ recipient: 'user@example.com', name: 'Usuario' });
  await service.sendGoalThreshold90({ recipient: 'user@example.com', name: 'Usuario' });

  assert.equal(sent.length, 3);
  assert.match(sent[0].html, /&lt;Usuario&gt;/);
  assert.doesNotMatch(sent[0].html, /<Usuario>/);
  assert.match(sent[1].subject, /contraseña/);
  assert.match(sent[2].text, /90%/);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  UpdateNotificationPreferences,
  normalizePreferences,
} = require('../../src/core/application/use-cases/user/UpdateNotificationPreferences');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('normaliza las preferencias de notificación con Gmail como canal disponible', async () => {
  let saved;
  const useCase = new UpdateNotificationPreferences({
    userRepository: {
      updateNotificationPreferences: async (value) => {
        saved = value;
        return value;
      },
    },
  });

  const result = await useCase.execute({
    userId,
    notificationsEnabled: true,
    preferredChannel: 'Email',
    notificationPreferences: { alerts: { leakDetection: false } },
  });

  assert.equal(saved.notificationPreferences.alerts.leakDetection, false);
  assert.equal(result.notificationPreferences.consumption.dailyReport, true);
  assert.equal(result.notificationPreferences.channels.email, true);
});

test('rechaza valores no booleanos y canales no soportados', async () => {
  const useCase = new UpdateNotificationPreferences({ userRepository: {} });
  await assert.rejects(
    () => useCase.execute({ userId, notificationsEnabled: true, preferredChannel: 'Email', notificationPreferences: { devices: { lowBattery: 'yes' } } }),
    (error) => error.status === 400
  );
  await assert.rejects(
    () => useCase.execute({ userId, notificationsEnabled: true, preferredChannel: 'Telegram', notificationPreferences: {} }),
    (error) => error.status === 400
  );
});

test('mantiene una forma segura cuando la preferencia almacenada está vacía', () => {
  const normalized = normalizePreferences({});
  assert.deepEqual(normalized.channels, { email: true, push: false });
  assert.equal(normalized.devices.lowBattery, true);
});

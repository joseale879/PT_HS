const test = require('node:test');
const assert = require('node:assert/strict');
const { GetPendingAlerts } = require('../../src/core/application/use-cases/alert/GetPendingAlerts');
const { UpdateAlertStatus } = require('../../src/core/application/use-cases/alert/UpdateAlertStatus');
const { CreateAlertRule } = require('../../src/core/application/use-cases/alert/CreateAlertRule');
const { UpdateAlertRule } = require('../../src/core/application/use-cases/alert/UpdateAlertRule');
const { SaveThresholdConfiguration } = require('../../src/core/application/use-cases/alert/SaveThresholdConfiguration');

const homeId = '837e149c-d641-4013-b230-5051390f5a15';
const alertId = '7eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('consulta alertas pendientes del hogar', async () => {
  const useCase = new GetPendingAlerts({ alertRepository: { findPendingByHome: async () => ({ homeId, pendingCount: 2 }) } });
  const result = await useCase.execute({ userId: '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', homeId });
  assert.equal(result.pendingCount, 2);
});

test('actualiza una alerta a Read o Dismissed', async () => {
  const useCase = new UpdateAlertStatus({ alertRepository: { updateStatus: async (input) => input } });
  const result = await useCase.execute({ userId: '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', alertId, status: 'Read' });
  assert.equal(result.status, 'Read');
  assert.throws(() => useCase.execute({ userId: 'user', alertId, status: 'Pending' }), (error) => error.status === 400);
});

test('crea y actualiza una regla de alerta válida', async () => {
  const repository = {
    createRule: async (input) => input,
    updateRule: async (input) => input
  };
  const create = new CreateAlertRule({ alertRepository: repository });
  const created = await create.execute({ userId: '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', homeId, alertType: 'daily_limit', threshold: 3, unit: 'm3_day' });
  assert.equal(created.threshold, 3);
  const update = new UpdateAlertRule({ alertRepository: repository });
  const updated = await update.execute({ userId: 'user', ruleId: alertId, active: false });
  assert.equal(updated.active, false);
});

test('rechaza reglas con tipo, unidad o umbral inválidos', async () => {
  const useCase = new CreateAlertRule({ alertRepository: { createRule: async () => null } });
  assert.throws(() => useCase.execute({ userId: 'user', homeId, alertType: 'unknown', threshold: 1, unit: 'm3_day' }), (error) => error.status === 400);
  assert.throws(() => useCase.execute({ userId: 'user', homeId, alertType: 'daily_limit', threshold: -1, unit: 'm3_day' }), (error) => error.status === 400);
});

test('guarda umbrales diarios y mensuales válidos', async () => {
  const useCase = new SaveThresholdConfiguration({ alertRepository: { saveThresholdConfiguration: async (input) => input } });
  const result = await useCase.execute({ userId: 'user', homeId, dailyLimit: 2.5, monthlyLimit: 40, active: true });
  assert.equal(result.dailyLimit, 2.5);
  assert.equal(result.monthlyLimit, 40);
  assert.throws(() => useCase.execute({ userId: 'user', homeId, active: true }), (error) => error.status === 400);
});

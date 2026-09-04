const test = require('node:test');
const assert = require('node:assert/strict');
const { ListAlertHistory } = require('../../src/core/application/use-cases/alert/ListAlertHistory');

const homeId = '123e4567-e89b-12d3-a456-426614174000';

test('lista el historial de alertas con filtros válidos', async () => {
  let received;
  const useCase = new ListAlertHistory({ alertRepository: { listHistory: async (input) => { received = input; return []; } } });
  await useCase.execute({ userId: 'user-1', homeId, status: 'Read', from: '2026-01-01', to: '2026-01-31' });
  assert.deepEqual(received, { userId: 'user-1', homeId, status: 'Read', from: '2026-01-01', to: '2026-01-31' });
});

test('rechaza filtros inválidos del historial de alertas', async () => {
  const useCase = new ListAlertHistory({ alertRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, status: 'Unknown' }), { status: 400 });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, from: '2026-02-01', to: '2026-01-01' }), { status: 400 });
});

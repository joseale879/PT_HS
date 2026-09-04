const test = require('node:test');
const assert = require('node:assert/strict');
const { ListAuditLogs } = require('../../src/core/application/use-cases/audit/ListAuditLogs');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('normaliza filtros y calcula el offset de auditoria', async () => {
  let received;
  const repository = { list: async (input) => { received = input; return { items: [], total: 0 }; } };

  await new ListAuditLogs({ repository }).execute({
    userId,
    action: ' login ',
    tableName: 'user_account',
    page: '2',
    pageSize: '10'
  });

  assert.equal(received.action, 'LOGIN');
  assert.equal(received.offset, 10);
  assert.equal(received.limit, 10);
  assert.equal(received.tableName, 'user_account');
});

test('rechaza acciones y rangos de fecha invalidos', async () => {
  const repository = { list: async () => ({ items: [], total: 0 }) };
  const useCase = new ListAuditLogs({ repository });

  assert.throws(
    () => useCase.execute({ userId, action: 'DROP' }),
    { status: 400 }
  );
  assert.throws(
    () => useCase.execute({ userId, from: '2026-01-02', to: '2026-01-01' }),
    { status: 400 }
  );
});

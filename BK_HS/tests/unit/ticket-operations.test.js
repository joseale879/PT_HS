const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CreateTicket,
  ListTickets,
  ListTicketCategories,
  GetTicket,
  UpdateTicket,
  RespondTicket,
} = require('../../src/core/application/use-cases/ticket/TicketOperations');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';
const ticketId = '6eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('crea un ticket y aplica prioridad Media por defecto', async () => {
  let input;
  const repository = { create: async (value) => { input = value; return value; } };

  await new CreateTicket({ repository }).execute({
    userId, category: 'Otros', title: 'Falla de prueba', description: 'Descripción de prueba',
  });

  assert.equal(input.priority, 'Media');
  assert.equal(input.category, 'Otros');
});

test('delega las operaciones de consulta y soporte', async () => {
  const calls = [];
  const repository = {
    list: async (value) => { calls.push(['list', value]); return []; },
    get: async (value) => { calls.push(['get', value]); return {}; },
    update: async (value) => { calls.push(['update', value]); return {}; },
    respond: async (value) => { calls.push(['respond', value]); return {}; },
  };

  await new ListTickets({ repository }).execute({ userId });
  await new GetTicket({ repository }).execute({ userId, ticketId });
  await new UpdateTicket({ repository }).execute({ userId, ticketId, status: 'En Proceso' });
  await new RespondTicket({ repository }).execute({ userId, ticketId, message: 'Respuesta válida' });

  assert.equal(calls.length, 4);
  assert.equal(calls[2][1].status, 'En Proceso');
});

test('consulta el catálogo de categorías', async () => {
  const repository = { listCategories: async (input) => { assert.deepEqual(input, { userId }); return [{ name: 'Otros' }]; } };
  assert.deepEqual(await new ListTicketCategories({ repository }).execute({ userId }), [{ name: 'Otros' }]);
});

test('rechaza ticket, usuario o mensaje inválidos', () => {
  const repository = { create: async () => null };
  const useCase = new CreateTicket({ repository });

  assert.throws(
    () => useCase.execute({ userId: 'bad', category: 'Otros', title: 'Título', description: 'Descripción' }),
    { status: 400 },
  );
  assert.throws(
    () => useCase.execute({ userId, category: 'Otros', title: 'x', description: 'Descripción' }),
    { status: 400 },
  );
});

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ExportUserData,
  CreateConsent,
  CreateArcoRequest,
  ListArcoRequests,
  UpdateArcoRequest,
} = require('../../src/core/application/use-cases/privacy/PrivacyOperations');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';
const requestId = '6eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('delega la exportación únicamente para el usuario autenticado', async () => {
  const repository = { exportUserData: async (input) => { assert.deepEqual(input, { userId }); return { exportedAt: '2026-09-13T00:00:00.000Z', data: {} }; } };
  assert.deepEqual(await new ExportUserData({ repository }).execute({ userId }), { exportedAt: '2026-09-13T00:00:00.000Z', data: {} });
  assert.throws(() => new ExportUserData({ repository }).execute({ userId: 'not-a-uuid' }), { status: 400 });
});

test('registra únicamente consentimientos aceptados y válidos', async () => {
  let input;
  const repository = { createConsent: async (value) => { input = value; return value; } };
  await new CreateConsent({ repository }).execute({ userId, type: 'policy_privacy', documentVersion: '2026-09', accepted: true });
  assert.equal(input.type, 'policy_privacy');
  assert.equal(input.accepted, true);
  assert.throws(() => new CreateConsent({ repository }).execute({ userId, type: 'marketing', documentVersion: '2026-09', accepted: false }), { status: 400 });
});

test('crea una solicitud ARCO con tipo y descripción normalizados', async () => {
  let input;
  const repository = { createArcoRequest: async (value) => { input = value; return value; } };
  await new CreateArcoRequest({ repository }).execute({ userId, type: 'access', description: ' Necesito una copia de mis datos ' });
  assert.deepEqual(input, { userId, type: 'access', description: 'Necesito una copia de mis datos' });
});

test('lista solicitudes con paginación y filtros validados', async () => {
  let input;
  const repository = { listArcoRequests: async (value) => { input = value; return { items: [], total: 0 }; } };
  const result = await new ListArcoRequests({ repository }).execute({ userId, type: 'access', page: '2', pageSize: '10' });
  assert.equal(input.offset, 10);
  assert.equal(input.limit, 10);
  assert.deepEqual(result.pagination, { page: 2, pageSize: 10, total: 0, totalPages: 0 });
});

test('exige respuesta al resolver o rechazar una solicitud', () => {
  const repository = { updateArcoRequest: async () => null };
  const useCase = new UpdateArcoRequest({ repository });
  assert.throws(() => useCase.execute({ userId, requestId, status: 'Resolved' }), { status: 400 });
  assert.throws(() => useCase.execute({ userId, requestId, status: 'Received', answer: 'Pendiente' }), { status: 400 });
});

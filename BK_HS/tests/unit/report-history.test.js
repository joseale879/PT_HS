const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { ListGeneratedReports, GetGeneratedReport } = require('../../src/core/application/use-cases/report/ReportOperations');
const { ReportStorage } = require('../../src/core/infrastructure/services/report/ReportStorage');

const userId = '11111111-1111-4111-8111-111111111111';
const homeId = '22222222-2222-4222-8222-222222222222';
const reportId = '33333333-3333-4333-8333-333333333333';

test('lista el historial de reportes con hogar, filtros y paginación', async () => {
  let received;
  const useCase = new ListGeneratedReports({
    repository: {
      listForUser: async (input) => {
        received = input;
        return { items: [{ reportId }], total: 1 };
      }
    }
  });

  const result = await useCase.execute({ userId, homeId, page: '2', pageSize: '5', type: 'pdf', status: 'Ready' });
  assert.deepEqual(received, { userId, homeId, type: 'pdf', status: 'Ready', limit: 5, offset: 5 });
  assert.deepEqual(result.pagination, { page: 2, pageSize: 5, total: 1, totalPages: 1 });
  assert.deepEqual(result.items, [{ reportId }]);
});

test('rechaza filtros inválidos del historial de reportes', async () => {
  const useCase = new ListGeneratedReports({ repository: { listForUser: async () => ({ items: [], total: 0 }) } });
  await assert.rejects(() => useCase.execute({ userId, type: 'csv' }), { status: 400 });
  await assert.rejects(() => useCase.execute({ userId, status: 'Published' }), { status: 400 });
  await assert.rejects(() => useCase.execute({ userId, homeId: 'invalid' }), { status: 400 });
});

test('consulta un reporte propio con UUID validado', async () => {
  let received;
  const useCase = new GetGeneratedReport({
    repository: {
      findForUser: async (input) => {
        received = input;
        return { reportId, status: 'Ready' };
      }
    }
  });
  assert.deepEqual(await useCase.execute({ userId, reportId }), { reportId, status: 'Ready' });
  assert.deepEqual(received, { userId, reportId });
});

test('almacena y lee reportes sin permitir rutas fuera del directorio', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hidrosmart-reports-'));
  const storage = new ReportStorage({ rootDir: root });
  try {
    const storagePath = await storage.write(reportId, 'pdf', Buffer.from('test-report'));
    assert.equal(storagePath, `${reportId}.pdf`);
    assert.deepEqual(await storage.read(storagePath), Buffer.from('test-report'));
    await assert.rejects(() => storage.read('../secret.pdf'), { status: 404 });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

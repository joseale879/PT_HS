const test = require('node:test');
const assert = require('node:assert/strict');
const { ListDeviceTelemetry } = require('../../src/core/application/use-cases/device/ListDeviceTelemetry');

const validDeviceId = '123e4567-e89b-12d3-a456-426614174000';

test('lista telemetria con paginacion y filtros normalizados', async () => {
  let received;
  const useCase = new ListDeviceTelemetry({
    deviceRepository: {
      listTelemetryForUser: async (input) => {
        received = input;
        return { items: [{ readingId: 'reading-1' }], total: 9 };
      }
    }
  });

  const result = await useCase.execute({
    userId: 'user-1',
    deviceId: validDeviceId,
    page: 2,
    pageSize: 5,
    from: '2026-09-14T00:00:00Z',
    to: '2026-09-14T23:59:59Z',
    sort: 'flowRateLpm',
    order: 'asc'
  });

  assert.deepEqual(received, {
    userId: 'user-1',
    deviceId: validDeviceId,
    from: '2026-09-14T00:00:00.000Z',
    to: '2026-09-14T23:59:59.000Z',
    sort: 'flowRateLpm',
    order: 'asc',
    limit: 5,
    offset: 5
  });
  assert.deepEqual(result.pagination, { page: 2, pageSize: 5, total: 9, totalPages: 2 });
});

test('rechaza fechas invertidas y ordenamiento desconocido', async () => {
  const useCase = new ListDeviceTelemetry({ deviceRepository: {} });

  assert.throws(
    () => useCase.execute({
      userId: 'user-1',
      deviceId: validDeviceId,
      from: '2026-09-15T00:00:00Z',
      to: '2026-09-14T00:00:00Z'
    }),
    (error) => error.status === 400
  );
  assert.throws(
    () => useCase.execute({ userId: 'user-1', deviceId: validDeviceId, sort: 'invalid' }),
    (error) => error.status === 400
  );
});

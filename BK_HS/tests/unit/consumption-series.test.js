const test = require('node:test');
const assert = require('node:assert/strict');
const { GetConsumptionSeries } = require('../../src/core/application/use-cases/consumption/GetConsumptionSeries');

const homeId = '837e149c-d641-4013-b230-5051390f5a15';

test('consulta una serie de consumo agrupada y normaliza groupBy', async () => {
  const calls = [];
  const useCase = new GetConsumptionSeries({
    consumptionRepository: {
      getSeries: async (input) => {
        calls.push(input);
        return [{ groupKey: '2026-09-01', consumptionM3: 1 }];
      }
    }
  });

  const result = await useCase.execute({
    userId: 'user-1',
    homeId,
    from: '2026-09-01',
    to: '2026-09-07',
    groupBy: ' MONTHLY '
  });

  assert.equal(result[0].consumptionM3, 1);
  assert.deepEqual(calls[0], {
    userId: 'user-1',
    homeId,
    from: '2026-09-01',
    to: '2026-09-07',
    groupBy: 'monthly'
  });
});

test('rechaza una agrupacion de consumo desconocida', () => {
  const useCase = new GetConsumptionSeries({ consumptionRepository: {} });
  assert.throws(
    () => useCase.execute({
      userId: 'user-1',
      homeId,
      from: '2026-09-01',
      to: '2026-09-07',
      groupBy: 'device'
    }),
    (error) => error.status === 400 && /groupBy/.test(error.message)
  );
});

test('rechaza un periodo futuro o mayor a 366 dias', () => {
  const useCase = new GetConsumptionSeries({ consumptionRepository: {} });
  assert.throws(
    () => useCase.execute({ userId: 'user-1', homeId, from: '2026-09-01', to: '2999-09-07' }),
    (error) => error.status === 400
  );
  assert.throws(
    () => useCase.execute({ userId: 'user-1', homeId, from: '2025-01-01', to: '2026-01-02' }),
    (error) => error.status === 400
  );
});

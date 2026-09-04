const test = require('node:test');
const assert = require('node:assert/strict');
const { GetConsumptionSummary } = require('../../src/core/application/use-cases/consumption/GetConsumptionSummary');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('rechaza un rango de consumo invertido', async () => {
  const useCase = new GetConsumptionSummary({ consumptionRepository: {} });
  await assert.rejects(
    async () => useCase.execute({ userId: validHomeId, homeId: validHomeId, from: '2026-08-20', to: '2026-08-01' }),
    /to no puede ser anterior a from/
  );
});

test('mapea una consulta válida al repositorio', async () => {
  const calls = [];
  const useCase = new GetConsumptionSummary({
    consumptionRepository: {
      calculateSummary: async (input) => { calls.push(input); return { totalM3: 1 }; }
    }
  });
  await useCase.execute({ userId: 'user-1', homeId: validHomeId, from: '2026-08-01', to: '2026-08-29' });
  assert.deepEqual(calls[0], { userId: 'user-1', homeId: validHomeId, from: '2026-08-01', to: '2026-08-29' });
});

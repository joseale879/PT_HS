const test = require('node:test');
const assert = require('node:assert/strict');
const { GetPeriodCost } = require('../../src/core/application/use-cases/consumption/GetPeriodCost');

const homeId = '837e149c-d641-4013-b230-5051390f5a15';

test('calcula el costo de un periodo mediante el repositorio', async () => {
  const repository = { calculatePeriodCost: async (input) => ({ ...input, totalCost: 12000 }) };
  const result = await new GetPeriodCost({ consumptionRepository: repository }).execute({
    userId: '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', homeId, from: '2026-09-01', to: '2026-09-02'
  });
  assert.equal(result.totalCost, 12000);
  assert.equal(result.from, '2026-09-01');
});

test('rechaza rangos de costo inválidos', async () => {
  const useCase = new GetPeriodCost({ consumptionRepository: { calculatePeriodCost: async () => null } });
  assert.throws(
    () => useCase.execute({ userId: 'user', homeId, from: '2026-09-03', to: '2026-09-01' }),
    (error) => error.status === 400
  );
  assert.throws(
    () => useCase.execute({ userId: 'user', homeId, from: 'bad', to: '2026-09-01' }),
    (error) => error.status === 400
  );
});

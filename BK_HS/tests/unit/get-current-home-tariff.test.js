const test = require('node:test');
const assert = require('node:assert/strict');
const { GetCurrentHomeTariff } = require('../../src/core/application/use-cases/tariff/GetCurrentHomeTariff');

const homeId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';

test('consulta la tarifa vigente del hogar', async () => {
  const repository = { findCurrentByHome: async (input) => ({
    rateId: '7eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', ...input, tier: 2, m3Value: 4200.25, fixedCharge: 12000
  }) };
  const result = await new GetCurrentHomeTariff({ tariffRepository: repository }).execute({
    userId: '9eed6ec7-0436-48b7-b5fe-402f8cfbd2ce', homeId, date: '2026-09-02'
  });
  assert.equal(result.tier, 2);
  assert.equal(result.m3Value, 4200.25);
  assert.equal(result.fixedCharge, 12000);
});

test('rechaza un homeId o fecha inválidos', async () => {
  const useCase = new GetCurrentHomeTariff({ tariffRepository: { findCurrentByHome: async () => null } });
  await assert.rejects(() => useCase.execute({ userId: 'user', homeId: 'bad', date: '2026-09-02' }), { status: 400 });
  await assert.rejects(() => useCase.execute({ userId: 'user', homeId, date: '02-09-2026' }), { status: 400 });
});

test('devuelve 404 cuando el hogar no tiene tarifa vigente', async () => {
  const useCase = new GetCurrentHomeTariff({ tariffRepository: { findCurrentByHome: async () => null } });
  await assert.rejects(() => useCase.execute({ userId: 'user', homeId, date: '2026-09-02' }), { status: 404 });
});

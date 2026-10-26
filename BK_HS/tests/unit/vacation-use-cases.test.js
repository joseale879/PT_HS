const test = require('node:test');
const assert = require('node:assert/strict');
const { SaveVacationMode } = require('../../src/core/application/use-cases/vacation/SaveVacationMode');
const { GetVacationMode } = require('../../src/core/application/use-cases/vacation/GetVacationMode');
const { DeleteVacationMode } = require('../../src/core/application/use-cases/vacation/DeleteVacationMode');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';
const homeId = '837e149c-d641-4013-b230-5051390f5a15';

test('guarda el modo vacaciones y normaliza el objetivo diario', async () => {
  let received;
  const useCase = new SaveVacationMode({
    repository: {
      save: async (input) => {
        received = input;
        return { vacationId: 'vacation-1', ...input };
      }
    }
  });

  const result = await useCase.execute({
    userId,
    homeId,
    active: true,
    startedAt: '2026-12-20',
    endedAt: '2027-01-05',
    dailyTargetConsumption: '2.50'
  });

  assert.equal(result.dailyTargetConsumption, 2.5);
  assert.deepEqual(received, {
    userId,
    homeId,
    active: true,
    startedAt: '2026-12-20',
    endedAt: '2027-01-05',
    dailyTargetConsumption: 2.5,
    notifyOnReturn: true
  });
});

test('valida estado, fechas, objetivo y notificación del modo vacaciones', () => {
  const useCase = new SaveVacationMode({ repository: { save: async () => null } });
  const valid = {
    userId,
    homeId,
    active: false,
    startedAt: '2026-12-20',
    endedAt: '2027-01-05',
    dailyTargetConsumption: 2,
    notifyOnReturn: false
  };

  assert.doesNotThrow(() => useCase.execute(valid));
  assert.throws(() => useCase.execute({ ...valid, active: 'true' }), { status: 400 });
  assert.throws(() => useCase.execute({ ...valid, startedAt: '2027-01-06' }), { status: 400 });
  assert.throws(() => useCase.execute({ ...valid, endedAt: '2026-12-19' }), { status: 400 });
  assert.throws(() => useCase.execute({ ...valid, dailyTargetConsumption: -1 }), { status: 400 });
  assert.throws(() => useCase.execute({ ...valid, notifyOnReturn: 'false' }), { status: 400 });
});

test('consulta el modo vacaciones del hogar y conserva la fecha solicitada', async () => {
  let received;
  const expected = { homeId, active: true, isActive: false };
  const useCase = new GetVacationMode({
    repository: {
      findByHome: async (input) => {
        received = input;
        return expected;
      }
    }
  });

  assert.deepEqual(await useCase.execute({ userId, homeId, date: '2026-12-24' }), expected);
  assert.deepEqual(received, { userId, homeId, date: '2026-12-24' });
  assert.throws(() => useCase.execute({ userId, homeId, date: '24-12-2026' }), { status: 400 });
  assert.throws(() => useCase.execute({ userId, homeId: 'invalid' }), { status: 400 });
});

test('elimina el modo vacaciones únicamente para el hogar indicado', async () => {
  let received;
  const useCase = new DeleteVacationMode({
    repository: {
      delete: async (input) => {
        received = input;
      }
    }
  });

  await useCase.execute({ userId, homeId });
  assert.deepEqual(received, { userId, homeId });
  assert.throws(() => useCase.execute({ userId, homeId: 'invalid' }), { status: 400 });
});

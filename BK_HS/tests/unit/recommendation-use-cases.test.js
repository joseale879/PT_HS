const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ListRecommendations,
  UpdateRecommendation,
  GetRecommendationSummary
} = require('../../src/core/application/use-cases/recommendation/RecommendationOperations');

const userId = '5eed6ec7-0436-48b7-b5fe-402f8cfbd2ce';
const homeId = '837e149c-d641-4013-b230-5051390f5a15';
const userRecommendationId = '7e4c6f3a-8f9d-4a1b-9c2d-6e5f4a3b2c1d';

test('lista recomendaciones del hogar con estado opcional', async () => {
  let received;
  const expected = [{ userRecommendationId, homeId, status: 'Pending' }];
  const useCase = new ListRecommendations({
    repository: {
      listUserRecommendations: async (input) => {
        received = input;
        return expected;
      }
    }
  });

  assert.deepEqual(await useCase.execute({ userId, homeId, status: 'Pending' }), expected);
  assert.deepEqual(received, { userId, homeId, status: 'Pending' });
});

test('rechaza filtros y estados de recomendaciones inválidos', async () => {
  const useCase = new ListRecommendations({
    repository: { listUserRecommendations: async () => [] }
  });

  await assert.rejects(() => useCase.execute({ userId, homeId: 'invalid' }), { status: 400 });
  await assert.rejects(() => useCase.execute({ userId, status: 'Unknown' }), { status: 400 });
  await assert.rejects(() => useCase.execute({ userId: 'invalid', homeId }), { status: 400 });
});

test('actualiza estado o utilidad sin permitir volver a Pending', async () => {
  let received;
  const expected = { userRecommendationId, status: 'Applied', usefulness: true };
  const useCase = new UpdateRecommendation({
    repository: {
      updateUserRecommendation: async (input) => {
        received = input;
        return expected;
      }
    }
  });

  assert.deepEqual(
    await useCase.execute({ userId, userRecommendationId, status: 'Applied', usefulness: true }),
    expected
  );
  assert.deepEqual(received, { userId, userRecommendationId, status: 'Applied', usefulness: true });
  await assert.rejects(
    () => useCase.execute({ userId, userRecommendationId, status: 'Pending' }),
    { status: 400 }
  );
  await assert.rejects(
    () => useCase.execute({ userId, userRecommendationId, usefulness: 'yes' }),
    { status: 400 }
  );
  await assert.rejects(() => useCase.execute({ userId, userRecommendationId }), { status: 400 });
});

test('consulta el resumen del hogar y valida sus identificadores', async () => {
  let received;
  const expected = { homeId, totalRecommendations: 2, pendingCount: 1 };
  const useCase = new GetRecommendationSummary({
    repository: {
      getHomeSummary: async (input) => {
        received = input;
        return expected;
      }
    }
  });

  assert.deepEqual(await useCase.execute({ userId, homeId }), expected);
  assert.deepEqual(received, { userId, homeId });
  await assert.rejects(() => useCase.execute({ userId, homeId: 'invalid' }), { status: 400 });
});

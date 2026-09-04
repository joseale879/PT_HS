const test = require('node:test');
const assert = require('node:assert/strict');
const { ListHomeMembers } = require('../../src/core/application/use-cases/home/ListHomeMembers');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('rechaza homeId inválido al consultar miembros', async () => {
  const useCase = new ListHomeMembers({ homeRepository: {} });
  await assert.rejects(
    useCase.execute({ userId: 'user-1', homeId: 'bad' }),
    /homeId no es válido/
  );
});

test('devuelve los miembros del hogar autorizado', async () => {
  const members = [{ user_id: 'user-1', home_role: 'Owner' }];
  const useCase = new ListHomeMembers({
    homeRepository: { findMembersForUser: async () => members }
  });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', homeId: validHomeId }), members);
});

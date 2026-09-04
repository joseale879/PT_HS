const test = require('node:test');
const assert = require('node:assert/strict');
const { ChangeHomeMemberRole } = require('../../src/core/application/use-cases/home/ChangeHomeMemberRole');

const homeId = '123e4567-e89b-12d3-a456-426614174000';
const memberUserId = '223e4567-e89b-12d3-a456-426614174000';

test('solo permite los roles Member y Guest', async () => {
  const useCase = new ChangeHomeMemberRole({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, memberUserId, homeRole: 'Owner' }), { status: 400 });
});

test('cambia el rol del miembro mediante el repositorio', async () => {
  const member = { user_id: memberUserId, home_role: 'Guest' };
  const useCase = new ChangeHomeMemberRole({ homeRepository: { changeMemberRole: async (input) => {
    assert.equal(input.memberUserId, memberUserId);
    assert.equal(input.homeRole, 'Guest');
    return member;
  } } });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', homeId, memberUserId, homeRole: 'Guest' }), member);
});

test('devuelve 404 si el miembro no existe', async () => {
  const useCase = new ChangeHomeMemberRole({ homeRepository: { changeMemberRole: async () => null } });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, memberUserId, homeRole: 'Member' }), { status: 404 });
});

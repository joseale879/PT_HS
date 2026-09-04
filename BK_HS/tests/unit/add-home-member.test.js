const test = require('node:test');
const assert = require('node:assert/strict');
const { AddHomeMember } = require('../../src/core/application/use-cases/home/AddHomeMember');

const homeId = '123e4567-e89b-12d3-a456-426614174000';

test('valida el email y el rol del hogar', async () => {
  const useCase = new AddHomeMember({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, email: 'bad', homeRole: 'Owner' }), { status: 400 });
});

test('agrega un miembro activo encontrado por el repositorio', async () => {
  const member = { user_id: 'user-2', email: 'member@example.com', home_role: 'Member' };
  const useCase = new AddHomeMember({ homeRepository: { addMemberForOwner: async (input) => {
    assert.equal(input.email, 'member@example.com');
    return member;
  } } });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', homeId, email: 'Member@Example.com', homeRole: 'Member' }), member);
});

test('devuelve 404 si no existe un usuario activo', async () => {
  const useCase = new AddHomeMember({ homeRepository: { addMemberForOwner: async () => null } });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, email: 'missing@example.com', homeRole: 'Guest' }), { status: 404 });
});

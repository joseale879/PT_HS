const test = require('node:test');
const assert = require('node:assert/strict');
const { RemoveHomeMember } = require('../../src/core/application/use-cases/home/RemoveHomeMember');

const homeId = '123e4567-e89b-12d3-a456-426614174000';
const memberUserId = '223e4567-e89b-12d3-a456-426614174000';

test('valida los identificadores', async () => {
  const useCase = new RemoveHomeMember({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, memberUserId: 'invalid' }), { status: 400 });
});

test('retira el miembro cuando existe', async () => {
  const useCase = new RemoveHomeMember({ homeRepository: { removeMember: async () => true } });
  await assert.doesNotReject(useCase.execute({ userId: 'user-1', homeId, memberUserId }));
});

test('devuelve 404 si el miembro no existe', async () => {
  const useCase = new RemoveHomeMember({ homeRepository: { removeMember: async () => false } });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId, memberUserId }), { status: 404 });
});

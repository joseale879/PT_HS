const test = require('node:test');
const assert = require('node:assert/strict');
const { RequestHomeMembership } = require('../../src/core/application/use-cases/home/RequestHomeMembership');
const { AnswerHomeMembership } = require('../../src/core/application/use-cases/home/AnswerHomeMembership');
const { ListHomeMembershipRequests } = require('../../src/core/application/use-cases/home/ListHomeMembershipRequests');

const homeId = '123e4567-e89b-12d3-a456-426614174000';
const requestId = '223e4567-e89b-12d3-a456-426614174000';

test('valida una solicitud de ingreso', async () => {
  const useCase = new RequestHomeMembership({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', homeId: 'invalid' }), { status: 400 });
});

test('crea una solicitud de ingreso', async () => {
  const request = { request_id: requestId, home_id: homeId, status: 'Pending' };
  const useCase = new RequestHomeMembership({ homeRepository: { requestMembership: async () => request } });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', homeId }), request);
});

test('valida la respuesta de una solicitud', async () => {
  const useCase = new AnswerHomeMembership({ homeRepository: {} });
  await assert.rejects(useCase.execute({ userId: 'user-1', requestId, status: 'Pending' }), { status: 400 });
});

test('responde una solicitud pendiente', async () => {
  const request = { request_id: requestId, status: 'Approved' };
  const useCase = new AnswerHomeMembership({ homeRepository: { answerMembershipRequest: async () => request } });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', requestId, status: 'Approved' }), request);
});

test('lista solicitudes de un hogar', async () => {
  const requests = [{ request_id: requestId, status: 'Pending' }];
  const useCase = new ListHomeMembershipRequests({ homeRepository: { findMembershipRequests: async () => requests } });
  assert.deepEqual(await useCase.execute({ userId: 'user-1', homeId }), requests);
});

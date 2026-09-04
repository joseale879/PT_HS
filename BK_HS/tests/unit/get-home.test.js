const test = require('node:test');
const assert = require('node:assert/strict');
const { GetHome } = require('../../src/core/application/use-cases/home/GetHome');

const validHomeId = '123e4567-e89b-12d3-a456-426614174000';

test('rechaza un homeId inválido', async () => {
  const useCase = new GetHome({ homeRepository: {} });
  await assert.rejects(
    useCase.execute({ userId: 'user-1', homeId: 'incorrecto' }),
    /homeId no es válido/
  );
});

test('devuelve 404 si el hogar no pertenece al usuario', async () => {
  const useCase = new GetHome({ homeRepository: { findByIdForUser: async () => null } });
  await assert.rejects(
    useCase.execute({ userId: 'user-1', homeId: validHomeId }),
    (error) => error.status === 404 && error.message === 'Hogar no encontrado'
  );
});

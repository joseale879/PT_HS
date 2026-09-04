const test = require('node:test');
const assert = require('node:assert/strict');
const { UpdateCurrentUser } = require('../../src/core/application/use-cases/user/UpdateCurrentUser');
const { GetCurrentUser } = require('../../src/core/application/use-cases/user/GetCurrentUser');
test('valida el nombre del perfil', async () => { const useCase = new UpdateCurrentUser({ userRepository: {} }); await assert.rejects(useCase.execute({ userId: 'user-1', fullName: 'A' }), { status: 400 }); });
test('actualiza el perfil del usuario autenticado', async () => { const user = { id: 'user-1', fullName: 'Usuario Hidro' }; const useCase = new UpdateCurrentUser({ userRepository: { updateProfile: async (input) => { assert.equal(input.fullName, 'Usuario Hidro'); return user; } } }); assert.deepEqual(await useCase.execute({ userId: 'user-1', fullName: ' Usuario Hidro ' }), user); });
test('devuelve el usuario autenticado', async () => { const user = { id: 'user-1' }; const useCase = new GetCurrentUser({ userRepository: { findById: async () => user } }); assert.deepEqual(await useCase.execute('user-1'), user); });

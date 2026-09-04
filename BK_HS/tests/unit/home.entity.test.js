const test = require('node:test');
const assert = require('node:assert/strict');
const { Home } = require('../../src/core/domain/entities/Home');

test('crea un hogar válido y normaliza textos', () => {
  const home = Home.create({
    name: '  Casa Familiar  ',
    address: 'Carrera 1 # 2-3',
    city: 'Neiva',
    tier: '3'
  });

  assert.equal(home.name, 'Casa Familiar');
  assert.equal(home.city, 'Neiva');
  assert.equal(home.tier, 3);
  assert.equal(home.status, 'Active');
});

test('rechaza un estrato fuera del rango permitido', () => {
  assert.throws(
    () => Home.create({ name: 'Casa', address: 'Calle 1', city: 'Neiva', tier: 7 }),
    /tier debe ser un número entero entre 1 y 6/
  );
});

test('rechaza nombres demasiado cortos', () => {
  assert.throws(
    () => Home.create({ name: 'Hi', address: 'Calle 1', city: 'Neiva' }),
    /name debe tener entre 3 y 100 caracteres/
  );
});

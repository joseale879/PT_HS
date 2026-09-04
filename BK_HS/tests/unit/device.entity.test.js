const test = require('node:test');
const assert = require('node:assert/strict');
const { Device } = require('../../src/core/domain/entities/Device');

test('crea un dispositivo válido y normaliza sus datos', () => {
  const device = Device.create({
    code: ' ESP32-001 ',
    name: 'Medidor principal',
    type: 'YF-S201',
    manufacturer: 'Hidro Smart',
    alertThreshold: '10.5'
  });

  assert.equal(device.code, 'ESP32-001');
  assert.equal(device.alertThreshold, 10.5);
  assert.equal(device.status, 'Active');
});

test('rechaza un código demasiado corto', () => {
  assert.throws(
    () => Device.create({ code: 'x', name: 'Medidor', type: 'YF-S201' }),
    /code debe tener entre 3 y 100 caracteres/
  );
});

test('rechaza umbral negativo', () => {
  assert.throws(
    () => Device.create({ code: 'ESP32-001', name: 'Medidor', type: 'YF-S201', alertThreshold: -1 }),
    /alertThreshold debe ser un número mayor o igual a cero/
  );
});

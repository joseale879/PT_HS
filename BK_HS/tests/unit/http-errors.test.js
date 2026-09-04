const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('../../src/shared/http');

function responseDouble() {
  return {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('mapea errores de integridad de PostgreSQL a conflictos HTTP', () => {
  const response = responseDouble();
  errorHandler({ code: '23505', message: 'duplicate key' }, {}, response, () => {});
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error.code, 'CONFLICT');
  assert.equal(response.body.error.message, 'El dato ya existe');
  assert.ok(response.body.meta.requestId);
});

test('mapea JSON inválido a 400 sin filtrar detalles internos', () => {
  const response = responseDouble();
  const error = new SyntaxError('Unexpected token');
  error.status = undefined;
  errorHandler(error, {}, response, () => {});
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, 'BAD_REQUEST');
  assert.match(response.body.error.message, /JSON/);
  assert.ok(response.body.meta.requestId);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { requestContext } = require('../../src/shared/http');

test('requestContext conserva un requestId seguro y registra sin secretos', () => {
  const headers = {};
  let finish;
  const logs = [];
  const req = { method: 'GET', path: '/health', headers: { 'x-request-id': 'ci-request-01' } };
  const res = { statusCode: 200, setHeader: (name, value) => { headers[name] = value; }, on: (event, callback) => { if (event === 'finish') finish = callback; } };
  requestContext(req, res, () => {}, { info: (line) => logs.push(JSON.parse(line)) });
  finish();
  assert.equal(req.id, 'ci-request-01');
  assert.equal(headers['X-Request-Id'], 'ci-request-01');
  assert.deepEqual(logs[0], { event: 'http_request', requestId: 'ci-request-01', method: 'GET', path: '/health', status: 200, durationMs: logs[0].durationMs });
  assert.equal(Number.isInteger(logs[0].durationMs), true);
  assert.equal(logs[0].durationMs >= 0, true);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createAuthRateLimiter } = require('../../src/api/middleware/authRateLimit');

test('limita solicitudes de autenticación y conserva el contrato de errores', async () => {
  const app = express();
  app.use(createAuthRateLimiter({ windowMs: 60_000, limit: 1 }));
  app.get('/', (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);

  try {
    const { port } = server.address();
    const first = await fetch(`http://127.0.0.1:${port}/`);
    const second = await fetch(`http://127.0.0.1:${port}/`);
    const body = await second.json();

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(body.error.code, 'TOO_MANY_REQUESTS');
    assert.ok(body.meta.requestId);
    assert.equal(second.headers.get('x-request-id'), body.meta.requestId);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

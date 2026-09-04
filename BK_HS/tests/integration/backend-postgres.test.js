const test = require('node:test');
const assert = require('node:assert/strict');

const apiUrl = process.env.INTEGRATION_API_URL || 'http://localhost:3000';
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const enabled = process.env.RUN_INTEGRATION === '1' && Boolean(databaseUrl);
const userEmail = process.env.INTEGRATION_USER_EMAIL;
const userPassword = process.env.INTEGRATION_USER_PASSWORD;
const authenticatedEnabled = enabled && Boolean(userEmail && userPassword);
const rlsUserId = process.env.INTEGRATION_RLS_USER_ID;
const rlsEnabled = enabled && Boolean(rlsUserId);

async function requestJson(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) }
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

test('health del backend y conexión PostgreSQL', { skip: !enabled }, async () => {
  const health = await fetch(`${apiUrl}/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.status, 'ok');

  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const result = await pool.query('SELECT current_database() AS database, current_user AS user');
    assert.equal(result.rows[0].database, 'hidro_smart');
    assert.equal(result.rows[0].user, 'hidro_smart_app');
  } finally {
    await pool.end();
  }
});

test('rutas protegidas rechazan solicitudes sin Bearer', { skip: !enabled }, async () => {
  for (const path of ['/api/v1/users/me', '/api/v1/homes', '/api/v1/devices', '/api/v1/consumption/summary']) {
    const response = await fetch(`${apiUrl}${path}`);
    assert.equal(response.status, 401, path);
  }
});

test('usuario de integración accede solo al flujo protegido de consulta', { skip: !authenticatedEnabled }, async () => {
  const login = await requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: userEmail, password: userPassword })
  });
  assert.equal(login.response.status, 200);
  assert.ok(login.body?.data?.accessToken);

  const token = login.body.data.accessToken;
  const headers = { authorization: `Bearer ${token}` };
  for (const path of ['/api/v1/users/me', '/api/v1/homes', '/api/v1/devices']) {
    const result = await requestJson(path, { headers });
    assert.equal(result.response.status, 200, path);
  }

  const logout = await requestJson('/api/v1/auth/logout', {
    method: 'POST',
    headers,
    body: JSON.stringify({ refreshToken: login.body.data.refreshToken })
  });
  assert.equal(logout.response.status, 204);
});

test('RLS limita hogares, miembros y dispositivos al usuario contextual', { skip: !rlsEnabled }, async () => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const withoutContext = await client.query(`
      SELECT
        (SELECT count(*) FROM home.home) AS homes,
        (SELECT count(*) FROM home.home_user) AS members,
        (SELECT count(*) FROM device.device) AS devices`);
    assert.equal(Number(withoutContext.rows[0].homes), 0);
    assert.equal(Number(withoutContext.rows[0].members), 0);
    assert.equal(Number(withoutContext.rows[0].devices), 0);

    await client.query("SELECT set_config('app.user_id', $1, true)", [rlsUserId]);
    const withContext = await client.query(`
      SELECT
        (SELECT count(*) FROM home.home) AS homes,
        (SELECT count(*) FROM home.home_user) AS members,
        (SELECT count(*) FROM device.device) AS devices`);
    assert.ok(Number(withContext.rows[0].homes) > 0, 'el usuario RLS debe tener al menos un hogar');
    assert.ok(Number(withContext.rows[0].members) > 0, 'el usuario RLS debe tener membresías visibles');
    assert.ok(Number(withContext.rows[0].devices) >= 0);
    await client.query('ROLLBACK');
  } finally {
    client.release();
    await pool.end();
  }
});

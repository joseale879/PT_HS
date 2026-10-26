const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');

const apiUrl = process.env.INTEGRATION_API_URL || 'http://localhost:3000';
const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const adminDatabaseUrl = process.env.INTEGRATION_ADMIN_DATABASE_URL;
const enabled = process.env.RUN_INTEGRATION === '1' && Boolean(databaseUrl);
const userEmail = process.env.INTEGRATION_USER_EMAIL;
const userPassword = process.env.INTEGRATION_USER_PASSWORD;
const authenticatedEnabled = enabled && Boolean(userEmail && userPassword);
const rlsEnabled = enabled && Boolean(adminDatabaseUrl);

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

  const live = await fetch(`${apiUrl}/health/live`);
  assert.equal(live.status, 200);
  const ready = await fetch(`${apiUrl}/health/ready`);
  assert.equal(ready.status, 200);
  const readyBody = await ready.json();
  assert.deepEqual(readyBody.checks, { database: 'up', mqtt: 'up' });

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
  for (const path of ['/api/v1/users/me', '/api/v1/homes', '/api/v1/devices', '/api/v1/consumption/summary', '/api/v1/privacy/export', '/api/v1/reports/consumption.pdf', '/api/v1/reports/consumption.xlsx']) {
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

test('RLS limita hogares, miembros, dispositivos y reportes al usuario contextual', { skip: !rlsEnabled }, async () => {
  const adminPool = new Pool({ connectionString: adminDatabaseUrl });
  const appPool = new Pool({ connectionString: databaseUrl });
  const userId = randomUUID();
  const homeId = randomUUID();
  const reportId = randomUUID();
  const ticketId = randomUUID();
  const responseId = randomUUID();
  const consentId = randomUUID();
  const arcoRequestId = randomUUID();
  const suffix = userId.replaceAll('-', '').slice(0, 12);

  try {
    await adminPool.query(
      `INSERT INTO user_account.user_account(user_account_id, username, email)
       VALUES ($1::uuid, $2::varchar, $3::varchar)`,
      [userId, `rls_ci_${suffix}`, `rls-ci-${suffix}@example.local`]
    );
    const homeUserRole = await adminPool.query(
      `SELECT role_id
         FROM user_account.role
        WHERE name = 'HomeUser' AND status = 'Active'`
    );
    await adminPool.query(
      `INSERT INTO user_account.user_role(user_account_id, role_id)
       VALUES ($1::uuid, $2::uuid)`,
      [userId, homeUserRole.rows[0].role_id]
    );
    await adminPool.query(
      `INSERT INTO home.home(home_id, name, address, city, tier)
       VALUES ($1::uuid, $2::varchar, 'CI RLS Address', 'Bogota', 3)`,
      [homeId, `CI RLS Home ${suffix}`]
    );
    await adminPool.query(
      `INSERT INTO home.home_user(home_id, user_account_id, home_role)
       VALUES ($1::uuid, $2::uuid, 'Owner')`,
      [homeId, userId]
    );
    await adminPool.query(
      `INSERT INTO analytics_support.generated_report(
         report_id, user_account_id, home_id, type, category, status
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, 'pdf', 'general', 'Generating')`,
      [reportId, userId, homeId]
    );
    const ticketCatalog = await adminPool.query(
      `SELECT
         (SELECT category_id FROM analytics_support.ticket_category ORDER BY name LIMIT 1) AS category_id,
         (SELECT priority_id FROM analytics_support.ticket_priority ORDER BY level LIMIT 1) AS priority_id,
         (SELECT status_id FROM analytics_support.ticket_status ORDER BY name LIMIT 1) AS status_id`
    );
    await adminPool.query(
      `INSERT INTO analytics_support.ticket(
         ticket_id, user_account_id, category_id, priority_id, status_id, title, description
       ) VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, 'CI RLS ticket', 'Ticket temporal para validar RLS')`,
      [
        ticketId,
        userId,
        ticketCatalog.rows[0].category_id,
        ticketCatalog.rows[0].priority_id,
        ticketCatalog.rows[0].status_id
      ]
    );
    await adminPool.query(
      `INSERT INTO analytics_support.ticket_response(response_id, ticket_id, user_account_id, message)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'Respuesta temporal')`,
      [responseId, ticketId, userId]
    );
    await adminPool.query(
      `INSERT INTO privacy.user_consent(consent_id, user_account_id, type, document_version, accepted)
       VALUES ($1::uuid, $2::uuid, 'policy_privacy', 'ci-1', TRUE)`,
      [consentId, userId]
    );
    await adminPool.query(
      `INSERT INTO privacy.arco_request(request_id, user_account_id, type, description, deadline_at)
       VALUES ($1::uuid, $2::uuid, 'access', 'Solicitud temporal para validar RLS', now() + interval '15 days')`,
      [arcoRequestId, userId]
    );
    const client = await appPool.connect();
    try {
      await client.query('BEGIN');
      const withoutContext = await client.query(`
        SELECT
          (SELECT count(*) FROM home.home) AS homes,
          (SELECT count(*) FROM home.home_user) AS members,
          (SELECT count(*) FROM device.device) AS devices,
          (SELECT count(*) FROM analytics_support.generated_report) AS reports,
          (SELECT count(*) FROM analytics_support.ticket) AS tickets,
          (SELECT count(*) FROM analytics_support.ticket_response) AS responses,
          (SELECT count(*) FROM privacy.user_consent) AS consents,
          (SELECT count(*) FROM privacy.arco_request) AS arco_requests`);
      assert.equal(Number(withoutContext.rows[0].homes), 0);
      assert.equal(Number(withoutContext.rows[0].members), 0);
      assert.equal(Number(withoutContext.rows[0].devices), 0);
      assert.equal(Number(withoutContext.rows[0].reports), 0);
      assert.equal(Number(withoutContext.rows[0].tickets), 0);
      assert.equal(Number(withoutContext.rows[0].responses), 0);
      assert.equal(Number(withoutContext.rows[0].consents), 0);
      assert.equal(Number(withoutContext.rows[0].arco_requests), 0);

      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      const withContext = await client.query(`
        SELECT
          (SELECT count(*) FROM home.home) AS homes,
          (SELECT count(*) FROM home.home_user) AS members,
          (SELECT count(*) FROM device.device) AS devices,
          (SELECT count(*) FROM analytics_support.generated_report) AS reports,
          (SELECT count(*) FROM analytics_support.ticket) AS tickets,
          (SELECT count(*) FROM analytics_support.ticket_response) AS responses,
          (SELECT count(*) FROM privacy.user_consent) AS consents,
          (SELECT count(*) FROM privacy.arco_request) AS arco_requests`);
      assert.equal(Number(withContext.rows[0].homes), 1);
      assert.equal(Number(withContext.rows[0].members), 1);
      assert.equal(Number(withContext.rows[0].devices), 0);
      assert.equal(Number(withContext.rows[0].reports), 1);
      assert.equal(Number(withContext.rows[0].tickets), 1);
      assert.equal(Number(withContext.rows[0].responses), 1);
      assert.equal(Number(withContext.rows[0].consents), 1);
      assert.equal(Number(withContext.rows[0].arco_requests), 1);
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  } finally {
    await adminPool.query('DELETE FROM privacy.arco_request WHERE request_id = $1::uuid', [arcoRequestId]);
    await adminPool.query('DELETE FROM privacy.user_consent WHERE consent_id = $1::uuid', [consentId]);
    await adminPool.query('DELETE FROM analytics_support.ticket_response WHERE response_id = $1::uuid', [responseId]);
    await adminPool.query('DELETE FROM analytics_support.ticket WHERE ticket_id = $1::uuid', [ticketId]);
    await adminPool.query('DELETE FROM analytics_support.generated_report WHERE report_id = $1::uuid', [reportId]);
    await adminPool.query('DELETE FROM home.home WHERE home_id = $1::uuid', [homeId]);
    await adminPool.query('DELETE FROM user_account.user_role WHERE user_account_id = $1::uuid', [userId]);
    await adminPool.query('DELETE FROM user_account.user_profile WHERE user_account_id = $1::uuid', [userId]);
    await adminPool.query('DELETE FROM user_account.user_account WHERE user_account_id = $1::uuid', [userId]);
    await appPool.end();
    await adminPool.end();
  }
});

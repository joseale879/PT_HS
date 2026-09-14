const test = require('node:test');
const assert = require('node:assert/strict');
const { startActuatorCommandTimeoutJob } = require('../../src/jobs/actuatorCommandTimeoutJob');

test('el job vence comandos sin ACK y se puede detener', async () => {
  const calls = [];
  const pool = {
    connect: async () => ({
      query: async (sql, values) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        if (sql.includes('pg_advisory_unlock')) return { rows: [{ unlocked: true }] };
        calls.push({ sql, values });
        return { rows: [{ expired_count: 2 }] };
      },
      release() {}
    })
  };
  const stop = startActuatorCommandTimeoutJob({
    pool,
    intervalMs: 5,
    timeoutMs: 1500,
    batchSize: 20,
    logger: { info() {}, error() {} }
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  stop();
  assert.equal(calls[0].sql, 'SELECT device.fn_timeout_actuator_commands($1::integer, $2::integer) AS expired_count');
  assert.deepEqual(calls[0].values, [2, 20]);
});

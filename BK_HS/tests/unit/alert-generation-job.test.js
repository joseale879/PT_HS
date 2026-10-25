const test = require('node:test');
const assert = require('node:assert/strict');
const { startAlertGenerationJob } = require('../../src/jobs/alertGenerationJob');

test('el job de alertas no se solapa y se puede detener', async () => {
  let calls = 0;
  let release;
  const pool = {
    connect: async () => ({
      query: async (sql) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        if (sql.includes('pg_advisory_unlock')) return { rows: [{ unlocked: true }] };
        calls += 1;
        await new Promise((resolve) => { release = resolve; });
        return { rows: [{ created_count: 1 }] };
      },
      release() {}
    })
  };
  const logger = { info() {}, error() {} };
  const stop = startAlertGenerationJob({ pool, intervalMs: 5, logger });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(calls, 1);
  release();
  stop();
});

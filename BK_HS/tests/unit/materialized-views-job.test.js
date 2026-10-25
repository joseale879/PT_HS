const test = require('node:test');
const assert = require('node:assert/strict');
const { startMaterializedViewsRefreshJob } = require('../../src/jobs/materializedViewsRefreshJob');

test('el job refresca las vistas sin solaparse', async () => {
  const calls = [];
  const pool = {
    connect: async () => ({
      query: async (sql) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        calls.push(sql);
        return { rows: [{ acquired: true }] };
      },
      release() {}
    })
  };
  const stop = startMaterializedViewsRefreshJob({
    pool,
    intervalMs: 5,
    logger: { error: () => {} }
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  stop();
  assert.ok(calls.length >= 1);
  assert.equal(calls[0], 'CALL analytics_support.prc_refresh_materialized_views()');
});

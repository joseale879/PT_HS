const test = require('node:test');
const assert = require('node:assert/strict');
const { startMaterializedViewsRefreshJob } = require('../../src/jobs/materializedViewsRefreshJob');

test('el job refresca las vistas sin solaparse', async () => {
  const calls = [];
  const stop = startMaterializedViewsRefreshJob({
    pool: { query: async (sql) => calls.push(sql) },
    intervalMs: 5,
    logger: { error: () => {} }
  });
  await new Promise((resolve) => setTimeout(resolve, 15));
  stop();
  assert.ok(calls.length >= 1);
  assert.equal(calls[0], 'CALL analytics_support.prc_refresh_materialized_views()');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const { startAlertGenerationJob } = require('../../src/jobs/alertGenerationJob');

test('el job de alertas no se solapa y se puede detener', async () => {
  let calls = 0;
  let release;
  const pool = { query: async () => { calls += 1; await new Promise((resolve) => { release = resolve; }); return { rows: [{ created_count: 1 }] }; } };
  const logger = { info() {}, error() {} };
  const stop = startAlertGenerationJob({ pool, intervalMs: 5, logger });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(calls, 1);
  release();
  stop();
});

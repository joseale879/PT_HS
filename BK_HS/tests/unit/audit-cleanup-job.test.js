const test = require('node:test');
const assert = require('node:assert/strict');
const { startAuditCleanupJob } = require('../../src/jobs/auditCleanupJob');

test('el job de auditoría llama al procedimiento y se puede detener', async () => {
  const calls = [];
  const pool = {
    connect: async () => ({
      query: async (sql, values) => {
        if (sql.includes('pg_try_advisory_lock')) return { rows: [{ acquired: true }] };
        calls.push({ sql, values });
        return { rows: [] };
      },
      release() {}
    })
  };
  const stop = startAuditCleanupJob({ pool, intervalMs: 5, retentionDays: 90, batchSize: 50, logger: { info() {}, error() {} } });
  await new Promise((resolve) => setTimeout(resolve, 15));
  stop();
  assert.equal(calls[0].sql, 'CALL audit.prc_clean_old_audit_logs($1::integer, $2::integer)');
  assert.deepEqual(calls[0].values, [90, 50]);
});

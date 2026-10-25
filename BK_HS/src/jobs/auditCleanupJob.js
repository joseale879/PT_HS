function startAuditCleanupJob({ pool, intervalMs = 86400000, retentionDays = 365, batchSize = 1000, logger = console }) {
  let running = false;
  const cleanup = async () => {
    if (running) return;
    running = true;
    let client;
    try {
      client = await pool.connect();
      const lock = await client.query("SELECT pg_try_advisory_lock(hashtext('hidrosmart:job:audit-cleanup')) AS acquired");
      if (!lock.rows[0]?.acquired) return;
      await client.query('CALL audit.prc_clean_old_audit_logs($1::integer, $2::integer)', [retentionDays, batchSize]);
      logger.info(`Limpieza de auditoría ejecutada: retención de ${retentionDays} días`);
    } catch (error) {
      logger.error('No se pudo limpiar la auditoría:', error.message);
    } finally {
      if (client) {
        await client.query("SELECT pg_advisory_unlock(hashtext('hidrosmart:job:audit-cleanup'))").catch(() => {});
        client.release();
      }
      running = false;
    }
  };
  const timer = setInterval(cleanup, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startAuditCleanupJob };

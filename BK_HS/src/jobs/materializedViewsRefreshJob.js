function startMaterializedViewsRefreshJob({ pool, intervalMs = 300000, logger = console }) {
  let running = false;
  const refresh = async () => {
    if (running) return;
    running = true;
    let client;
    try {
      client = await pool.connect();
      const lock = await client.query("SELECT pg_try_advisory_lock(hashtext('hidrosmart:job:materialized-views')) AS acquired");
      if (!lock.rows[0]?.acquired) return;
      await client.query('CALL analytics_support.prc_refresh_materialized_views()');
    } catch (error) {
      logger.error('No se pudieron refrescar las vistas materializadas:', error.message);
    } finally {
      if (client) {
        await client.query("SELECT pg_advisory_unlock(hashtext('hidrosmart:job:materialized-views'))").catch(() => {});
        client.release();
      }
      running = false;
    }
  };
  const timer = setInterval(refresh, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startMaterializedViewsRefreshJob };

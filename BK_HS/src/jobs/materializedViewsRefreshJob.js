function startMaterializedViewsRefreshJob({ pool, intervalMs = 300000, logger = console }) {
  let running = false;
  const refresh = async () => {
    if (running) return;
    running = true;
    try {
      await pool.query('CALL analytics_support.prc_refresh_materialized_views()');
    } catch (error) {
      logger.error('No se pudieron refrescar las vistas materializadas:', error.message);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(refresh, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startMaterializedViewsRefreshJob };

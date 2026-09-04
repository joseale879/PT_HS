function startAlertGenerationJob({ pool, intervalMs = 300000, logger = console }) {
  let running = false;
  const generate = async () => {
    if (running) return;
    running = true;
    try {
      const result = await pool.query('SELECT alert_rate.fn_generate_alert_events(CURRENT_DATE) AS created_count');
      const created = Number(result.rows[0]?.created_count || 0);
      if (created > 0) logger.info(`Alertas generadas automáticamente: ${created}`);
    } catch (error) {
      logger.error('No se pudieron generar alertas automáticamente:', error.message);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(generate, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startAlertGenerationJob };

function startAlertGenerationJob({ pool, intervalMs = 300000, logger = console }) {
  let running = false;
  const generate = async () => {
    if (running) return;
    running = true;
    let client;
    try {
      client = await pool.connect();
      const lock = await client.query("SELECT pg_try_advisory_lock(hashtext('hidrosmart:job:alert-generation')) AS acquired");
      if (!lock.rows[0]?.acquired) return;
      const result = await client.query('SELECT alert_rate.fn_generate_alert_events(CURRENT_DATE) AS created_count');
      const created = Number(result.rows[0]?.created_count || 0);
      if (created > 0) logger.info(`Alertas generadas automáticamente: ${created}`);
    } catch (error) {
      logger.error('No se pudieron generar alertas automáticamente:', error.message);
    } finally {
      if (client) {
        await client.query("SELECT pg_advisory_unlock(hashtext('hidrosmart:job:alert-generation'))").catch(() => {});
        client.release();
      }
      running = false;
    }
  };
  const timer = setInterval(generate, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startAlertGenerationJob };

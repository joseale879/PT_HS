function startActuatorCommandTimeoutJob({
  pool,
  intervalMs = 30000,
  timeoutMs = 60000,
  batchSize = 100,
  logger = console
}) {
  let running = false;

  const expire = async () => {
    if (running) return;
    running = true;
    let client;
    try {
      client = await pool.connect();
      const lock = await client.query(
        "SELECT pg_try_advisory_lock(hashtext('hidrosmart:job:actuator-timeout')) AS acquired"
      );
      if (!lock.rows[0]?.acquired) return;

      const timeoutSeconds = Math.max(1, Math.ceil(Number(timeoutMs) / 1000));
      const result = await client.query(
        'SELECT device.fn_timeout_actuator_commands($1::integer, $2::integer) AS expired_count',
        [timeoutSeconds, batchSize]
      );
      const expired = Number(result.rows[0]?.expired_count || 0);
      if (expired > 0) logger.info(`Comandos de actuadores vencidos: ${expired}`);
    } catch (error) {
      logger.error('No se pudieron vencer comandos de actuadores:', error.message);
    } finally {
      if (client) {
        await client.query(
          "SELECT pg_advisory_unlock(hashtext('hidrosmart:job:actuator-timeout'))"
        ).catch(() => {});
        client.release();
      }
      running = false;
    }
  };

  const timer = setInterval(expire, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}

module.exports = { startActuatorCommandTimeoutJob };

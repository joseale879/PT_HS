require('dotenv').config();

const app = require('./src/app');
const { pool, ingestPool } = require('./src/infrastructure/db');
const { getEnv } = require('./src/config/env');
const { startMaterializedViewsRefreshJob } = require('./src/jobs/materializedViewsRefreshJob');
const { startAlertGenerationJob } = require('./src/jobs/alertGenerationJob');
const { startAuditCleanupJob } = require('./src/jobs/auditCleanupJob');
const { startActuatorCommandTimeoutJob } = require('./src/jobs/actuatorCommandTimeoutJob');
const { mqttClient } = require('./src/core/infrastructure/services/mqtt/mqttClientSingleton');
const { MqttSubscriber } = require('./src/core/infrastructure/services/mqtt/MqttSubscriber');
const { IngestReading } = require('./src/core/application/use-cases/telemetry/IngestReading');
const { PostgresTelemetryRepository } = require('./src/core/infrastructure/repositories/postgres/PostgresTelemetryRepository');
const { PostgresDeviceRepository } = require('./src/core/infrastructure/repositories/postgres/PostgresDeviceRepository');

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, () => {
  console.log(`Hidro Smart API escuchando en http://localhost:${port}`);
});
const stopRefreshJob = startMaterializedViewsRefreshJob({
  pool,
  intervalMs: getEnv().materializedViewsRefreshMs
});
const stopAlertGenerationJob = startAlertGenerationJob({
  pool,
  intervalMs: getEnv().alertGenerationIntervalMs
});
const stopAuditCleanupJob = startAuditCleanupJob({
  pool,
  intervalMs: getEnv().auditCleanupIntervalMs,
  retentionDays: getEnv().auditRetentionDays,
  batchSize: getEnv().auditCleanupBatchSize
});
const stopActuatorCommandTimeoutJob = startActuatorCommandTimeoutJob({
  pool,
  intervalMs: getEnv().actuatorCommandTimeoutMs,
  timeoutMs: getEnv().actuatorCommandTimeoutMs,
  batchSize: getEnv().actuatorCommandTimeoutBatchSize
});
const mqttConfig = require('./src/config/mqtt').getMqttConfig();
const telemetryRepository = new PostgresTelemetryRepository();
const mqttSubscriber = new MqttSubscriber({
  mqttClient,
  qos: mqttConfig.qos,
  maxPayloadBytes: mqttConfig.maxPayloadBytes,
  ingestReading: new IngestReading({ telemetryRepository }),
  deviceRepository: new PostgresDeviceRepository()
});
mqttSubscriber.start();

async function shutdown(signal) {
  console.log(`${signal}: cerrando servidor...`);
  server.close(async (error) => {
    stopRefreshJob();
    stopAlertGenerationJob();
    stopAuditCleanupJob();
    stopActuatorCommandTimeoutJob();
    await mqttSubscriber.stop();
    await pool.end();
    await ingestPool.end();
    if (error) process.exitCode = 1;
    process.exit();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

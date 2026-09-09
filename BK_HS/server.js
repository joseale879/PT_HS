require('dotenv').config();

const app = require('./src/app');
const { pool, ingestPool } = require('./src/infrastructure/db');
const { getEnv } = require('./src/config/env');
const { startMaterializedViewsRefreshJob } = require('./src/jobs/materializedViewsRefreshJob');
const { startAlertGenerationJob } = require('./src/jobs/alertGenerationJob');

const { MqttClient } = require('./src/core/infrastructure/services/mqtt/MqttClient');
const { MqttSubscriber } = require('./src/core/infrastructure/services/mqtt/MqttSubscriber');

const { handleReading } = require('./src/mqtt/handlers/reading.handler');

const {
  PostgresReadingIngestRepository
} = require('./src/core/infrastructure/repositories/postgres/PostgresReadingIngestRepository');

const env = getEnv();

const port = Number(process.env.PORT || env.port || 3000);

const server = app.listen(port, () => {
  console.log(`Hidro Smart API escuchando en http://localhost:${port}`);
});

const stopRefreshJob = startMaterializedViewsRefreshJob({
  pool,
  intervalMs: env.materializedViewsRefreshMs
});

const stopAlertGenerationJob = startAlertGenerationJob({
  pool,
  intervalMs: env.alertGenerationIntervalMs
});

// ============================================================
// MQTT + INGESTA DE LECTURAS DEL ESP32
// ============================================================

const mqttConfig = require('./src/config/mqtt').getMqttConfig();

const mqttClient = new MqttClient();

const readingRepository = new PostgresReadingIngestRepository({
  pool: ingestPool,
  logger: console
});

const mqttSubscriber = new MqttSubscriber({
  mqttClient,
  qos: mqttConfig.qos,

  handlers: {
    telemetry: (payload) => handleReading({
      ...payload,
      readingRepository
    })
  }
});

mqttSubscriber.start();

// ============================================================
// SHUTDOWN
// ============================================================

async function shutdown(signal) {
  console.log(`${signal}: cerrando servidor...`);

  server.close(async (error) => {
    try {
      stopRefreshJob();
      stopAlertGenerationJob();

      await mqttSubscriber.stop();

      await pool.end();

      if (ingestPool) {
        await ingestPool.end();
      }

      if (error) {
        process.exitCode = 1;
      }

      process.exit();
    } catch (shutdownError) {
      console.error('Error cerrando servidor:', shutdownError);
      process.exitCode = 1;
      process.exit();
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

require('dotenv').config();

const app = require('./src/app');
const { pool } = require('./src/infrastructure/db');
const { getEnv } = require('./src/config/env');
const { startMaterializedViewsRefreshJob } = require('./src/jobs/materializedViewsRefreshJob');
const { startAlertGenerationJob } = require('./src/jobs/alertGenerationJob');
const { MqttClient } = require('./src/core/infrastructure/services/mqtt/MqttClient');
const { MqttSubscriber } = require('./src/core/infrastructure/services/mqtt/MqttSubscriber');

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
  intervalMs: getEnv().materializedViewsRefreshMs
});
const mqttConfig = require('./src/config/mqtt').getMqttConfig();
const mqttClient = new MqttClient();
const mqttSubscriber = new MqttSubscriber({ mqttClient, qos: mqttConfig.qos });
mqttSubscriber.start();

async function shutdown(signal) {
  console.log(`${signal}: cerrando servidor...`);
  server.close(async (error) => {
    stopRefreshJob();
    stopAlertGenerationJob();
    await mqttSubscriber.stop();
    await pool.end();
    if (error) process.exitCode = 1;
    process.exit();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

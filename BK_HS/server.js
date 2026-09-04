require('dotenv').config();

const app = require('./src/app');
const { pool } = require('./src/infrastructure/db');
const { getEnv } = require('./src/config/env');
const { startMaterializedViewsRefreshJob } = require('./src/jobs/materializedViewsRefreshJob');
const { startAlertGenerationJob } = require('./src/jobs/alertGenerationJob');

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

async function shutdown(signal) {
  console.log(`${signal}: cerrando servidor...`);
  server.close(async (error) => {
    stopRefreshJob();
    stopAlertGenerationJob();
    await pool.end();
    if (error) process.exitCode = 1;
    process.exit();
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

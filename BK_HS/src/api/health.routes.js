const router = require('express').Router();
const { pool } = require('../infrastructure/db');
const { asyncHandler } = require('../shared/http');
const { getRuntimeState } = require('../shared/runtimeState');

router.get('/live', (_req, res) => {
  res.json({ status: 'ok' });
});

router.get('/ready', asyncHandler(async (_req, res) => {
  let database = 'down';
  try {
    await pool.query('SELECT 1');
    database = 'up';
  } catch (_error) {
    res.status(503).json({ status: 'not_ready', checks: { database, mqtt: 'down' } });
    return;
  }
  const runtime = getRuntimeState();
  const mqtt = runtime.mqttConnected && runtime.mqttSubscribed ? 'up' : 'down';
  const ready = database === 'up' && mqtt === 'up';
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'not_ready', checks: { database, mqtt } });
}));

router.get('/', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT current_database() AS database, now() AS server_time');
  res.json({ status: 'ok', database: result.rows[0].database, serverTime: result.rows[0].server_time });
}));

module.exports = router;

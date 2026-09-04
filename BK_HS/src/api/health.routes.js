const router = require('express').Router();
const { pool } = require('../infrastructure/db');
const { asyncHandler } = require('../shared/http');

router.get('/', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT current_database() AS database, now() AS server_time');
  res.json({ status: 'ok', database: result.rows[0].database, serverTime: result.rows[0].server_time });
}));

module.exports = router;

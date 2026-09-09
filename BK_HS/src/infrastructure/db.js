const { Pool } = require('pg');
const { getEnv } = require('../config/env');

const config = getEnv();

const pool = new Pool(config.db);
const ingestPool = new Pool(config.ingestDb);

pool.on('error', (error) => {
  console.error('Error inesperado del pool PostgreSQL:', error.message);
});

ingestPool.on('error', (error) => {
  console.error('Error inesperado del pool PostgreSQL ingest:', error.message);
});

async function withTransaction(userId, callback) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (userId) {
      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
    }

    const result = await callback(client);

    await client.query('COMMIT');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { pool, ingestPool, withTransaction };
const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET ||= 'unit-test-only-secret-that-must-not-be-used-outside-tests';
process.env.DB_HOST ||= '127.0.0.1';
process.env.DB_PORT ||= '5432';
process.env.DB_NAME ||= 'unit_test';
process.env.DB_USER ||= 'unit_test';
process.env.DB_PASSWORD ||= 'unit_test';
process.env.DB_INGEST_USER ||= 'unit_test_ingest';
process.env.DB_INGEST_PASSWORD ||= 'unit_test';

const { PostgresReadingIngestRepository } = require('../../src/core/infrastructure/repositories/postgres/PostgresReadingIngestRepository');

function createPool({ insertRows }) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql: String(sql), params });
      if (String(sql).includes('fn_resolve_ingest_device')) {
        return { rows: [{ device_id: 'device-uuid', home_id: 'home-uuid' }] };
      }
      if (String(sql).includes('INSERT INTO consumption.sensor_reading')) {
        return { rows: insertRows };
      }
      return { rows: [] };
    },
    release() {}
  };
  return {
    calls,
    pool: { connect: async () => client }
  };
}

const reading = {
  deviceCode: 'HS_ESP32_001',
  mqttMessageId: 'message-001',
  flowRateLpm: 2.4,
  consumptionLiters: 0.04,
  totalLiters: 3.407,
  pulses: 1,
  sampleIntervalSeconds: 1,
  timestamp: '2026-09-13T12:00:00.000Z'
};

test('persists the MQTT message id and returns the inserted reading', async () => {
  const { pool, calls } = createPool({
    insertRows: [{
      reading_id: 'reading-uuid',
      device_id: 'device-uuid',
      home_id: 'home-uuid',
      recorded_at: reading.timestamp,
      consumption_liters: '0.04',
      consumption_m3: '0.00004',
      activity: 'General',
      flow_rate_lpm: '2.4',
      total_liters: '3.407',
      pulses: 1,
      sample_interval_seconds: '1',
      created_at: reading.timestamp
    }]
  });

  const repository = new PostgresReadingIngestRepository({ pool, logger: { info() {} } });
  const result = await repository.save(reading);
  const insert = calls.find(({ sql }) => sql.includes('INSERT INTO consumption.sensor_reading'));

  assert.equal(insert.params[9], 'message-001');
  assert.match(insert.sql, /ON CONFLICT \(device_id, mqtt_message_id\)/);
  assert.equal(result.inserted, true);
  assert.equal(result.duplicate, false);
  assert.equal(result.mqttMessageId, 'message-001');
});

test('treats a repeated MQTT message id as an acknowledged duplicate', async () => {
  const { pool, calls } = createPool({ insertRows: [] });
  const repository = new PostgresReadingIngestRepository({ pool, logger: { info() {} } });

  const result = await repository.save(reading);

  assert.deepEqual(result, {
    inserted: false,
    duplicate: true,
    readingId: null,
    deviceCode: 'HS_ESP32_001',
    mqttMessageId: 'message-001'
  });
  assert.ok(calls.some(({ sql }) => sql === 'COMMIT'));
});

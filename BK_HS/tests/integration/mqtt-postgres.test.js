const test = require('node:test');
const assert = require('node:assert/strict');
const mqtt = require('mqtt');
const { Pool } = require('pg');

const enabled = process.env.RUN_INTEGRATION === '1'
  && Boolean(process.env.INTEGRATION_DATABASE_URL)
  && Boolean(process.env.INTEGRATION_ADMIN_DATABASE_URL);
const apiUrl = process.env.INTEGRATION_API_URL || 'http://localhost:3000';

async function waitForMqttReadiness(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${apiUrl}/health/ready`);
      if (response.ok) {
        const health = await response.json();
        if (health.checks?.mqtt === 'up') return;
      }
    } catch (_error) {
      // The API may still be starting; keep polling until the bounded deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('El backend no quedó suscrito al broker MQTT antes del timeout');
}

test('MQTT persiste una lectura y descarta el duplicado en PostgreSQL', { skip: !enabled }, async () => {
  const adminPool = new Pool({ connectionString: process.env.INTEGRATION_ADMIN_DATABASE_URL });
  const homeId = '00000000-0000-4000-8000-000000000931';
  const deviceId = '00000000-0000-4000-8000-000000000932';
  const deviceCode = 'CI_MQTT_001';
  const messageId = 'ci-mqtt-duplicate-001';
  let mqttClient;

  try {
    await waitForMqttReadiness();
    await adminPool.query('DELETE FROM consumption.sensor_reading WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM home.home_device WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM device.device WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM home.home WHERE home_id = $1::uuid', [homeId]);
    await adminPool.query(
      `INSERT INTO home.home(home_id, name, address, city, tier)
       VALUES ($1::uuid, 'CI MQTT Home', 'CI Address', 'Bogota', 3)`,
      [homeId]
    );
    await adminPool.query(
      `INSERT INTO device.device(device_id, code, name, type)
       VALUES ($1::uuid, $2::varchar, 'CI MQTT Device', 'Flow')`,
      [deviceId, deviceCode]
    );
    await adminPool.query(
      'INSERT INTO home.home_device(home_id, device_id) VALUES ($1::uuid, $2::uuid)',
      [homeId, deviceId]
    );

    mqttClient = await new Promise((resolve, reject) => {
      const client = mqtt.connect(process.env.INTEGRATION_MQTT_URL || 'mqtt://localhost:1883');
      client.once('connect', () => resolve(client));
      client.once('error', reject);
    });
    const topic = `hidrosmart/devices/${deviceCode}/telemetry`;
    const payload = JSON.stringify({
      mqttMessageId: messageId,
      deviceId: deviceCode,
      flowRateLpm: 2.4,
      consumptionLiters: 0.04,
      totalLiters: 3.407,
      pulses: 1,
      sampleIntervalSeconds: 1,
      wifiRssiDbm: -56,
      batteryLevel: 90,
      voltage: 5,
      temperature: 25,
      timestamp: new Date().toISOString()
    });
    await new Promise((resolve, reject) => mqttClient.publish(topic, payload, { qos: 1 }, (error) => error ? reject(error) : resolve()));
    await new Promise((resolve, reject) => mqttClient.publish(topic, payload, { qos: 1 }, (error) => error ? reject(error) : resolve()));

    const deadline = Date.now() + 5000;
    let result;
    do {
      result = await adminPool.query(
        `SELECT count(*)::integer AS count, max(mqtt_message_id) AS mqtt_message_id
           FROM consumption.sensor_reading
          WHERE device_id = $1::uuid AND mqtt_message_id = $2::varchar`,
        [deviceId, messageId]
      );
      if (result.rows[0].count === 1) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    } while (Date.now() < deadline);

    assert.equal(result.rows[0].count, 1);
    assert.equal(result.rows[0].mqtt_message_id, messageId);
  } finally {
    if (mqttClient) await new Promise((resolve) => mqttClient.end(true, resolve));
    await adminPool.query('DELETE FROM consumption.sensor_reading WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM home.home_device WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM device.device WHERE device_id = $1::uuid', [deviceId]);
    await adminPool.query('DELETE FROM home.home WHERE home_id = $1::uuid', [homeId]);
    await adminPool.end();
  }
});

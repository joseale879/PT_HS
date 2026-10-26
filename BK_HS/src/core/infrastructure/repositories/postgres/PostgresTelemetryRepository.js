const { withIngestTransaction } = require('../../../../infrastructure/db');

class PostgresTelemetryRepository {
  async ingestTelemetry({ deviceCode, mqttMessageId, consumptionLiters, recordedAt, flowRateLpm, totalLiters, pulses, sampleIntervalSeconds, wifiRssiDbm, signalQuality, batteryLevel, voltage, temperature, hardwareId }) {
    const result = await withIngestTransaction((client) => client.query(
      `SELECT inserted, reading_id, home_id
         FROM device.fn_ingest_sensor_reading($1::varchar, $2::varchar, $3::numeric, $4::timestamptz,
           $5::numeric, $6::numeric, $7::integer, $8::numeric, $9::integer, $10::integer,
           $11::integer, $12::numeric, $13::numeric, $14::varchar)`,
      [deviceCode, mqttMessageId, consumptionLiters, recordedAt, flowRateLpm, totalLiters, pulses, sampleIntervalSeconds, wifiRssiDbm, signalQuality, batteryLevel, voltage, temperature, hardwareId]
    ));
    const row = result.rows[0] || {};
    return {
      inserted: row.inserted === true,
      readingId: row.reading_id || null,
      homeId: row.home_id || null,
      duplicate: row.inserted === false
    };
  }
}

module.exports = { PostgresTelemetryRepository };

const { ingestPool } = require('../../../../infrastructure/db');

function requiredDeviceCode(reading) {
  const deviceCode = reading.deviceCode || reading.deviceId;

  if (typeof deviceCode !== 'string' || !deviceCode.trim()) {
    throw new Error('deviceCode es obligatorio para guardar la lectura MQTT');
  }

  return deviceCode.trim();
}

function requiredNonNegativeNumber(value, fieldName) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} es obligatorio, numérico y no puede ser negativo`);
  }

  return numberValue;
}

function optionalNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} debe ser numérico y no puede ser negativo`);
  }

  return numberValue;
}

function optionalInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') return null;

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} debe ser un entero no negativo`);
  }

  return numberValue;
}

function parseRecordedAt(timestamp) {
  const recordedAt = timestamp ? new Date(timestamp) : new Date();

  if (Number.isNaN(recordedAt.getTime())) {
    throw new Error('timestamp debe ser una fecha válida');
  }

  return recordedAt;
}

function mapInsertedReading(row, deviceCode) {
  return {
    readingId: row.reading_id,
    deviceCode,
    deviceId: row.device_id,
    homeId: row.home_id,
    recordedAt: row.recorded_at,
    consumptionLiters: Number(row.consumption_liters),
    consumptionM3: Number(row.consumption_m3),
    activity: row.activity,
    flowRateLpm: row.flow_rate_lpm === null ? null : Number(row.flow_rate_lpm),
    totalLiters: row.total_liters === null ? null : Number(row.total_liters),
    pulses: row.pulses === null ? null : Number(row.pulses),
    sampleIntervalSeconds: row.sample_interval_seconds === null
      ? null
      : Number(row.sample_interval_seconds),
    createdAt: row.created_at
  };
}

class PostgresReadingIngestRepository {
  constructor({ pool = ingestPool, logger = console } = {}) {
    if (!pool) {
      throw new Error(
        'Falta configurar ingestPool en src/infrastructure/db.js para guardar lecturas MQTT'
      );
    }

    this.pool = pool;
    this.logger = logger;
  }

  async save(reading) {
    const deviceCode = requiredDeviceCode(reading);

    const flowRateLpm = requiredNonNegativeNumber(
      reading.flowRateLpm,
      'flowRateLpm'
    );

    const consumptionLiters = requiredNonNegativeNumber(
      reading.consumptionLiters,
      'consumptionLiters'
    );

    const totalLiters = optionalNonNegativeNumber(
      reading.totalLiters,
      'totalLiters'
    );

    const pulses = optionalInteger(
      reading.pulses,
      'pulses'
    );

    const sampleIntervalSeconds = optionalNonNegativeNumber(
      reading.sampleIntervalSeconds,
      'sampleIntervalSeconds'
    );

    const recordedAt = parseRecordedAt(reading.timestamp);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const resolvedDeviceResult = await client.query(
        `
          SELECT device_id, home_id
          FROM device.fn_resolve_ingest_device($1::varchar)
        `,
        [deviceCode]
      );

      const resolvedDevice = resolvedDeviceResult.rows[0];

      if (!resolvedDevice) {
        throw new Error(
          `No existe un dispositivo activo vinculado a un hogar activo para el código ${deviceCode}`
        );
      }

      const insertResult = await client.query(
        `
          INSERT INTO consumption.sensor_reading (
            device_id,
            home_id,
            recorded_at,
            consumption_liters,
            activity,
            flow_rate_lpm,
            total_liters,
            pulses,
            sample_interval_seconds
          )
          VALUES (
            $1::uuid,
            $2::uuid,
            $3::timestamptz,
            $4::numeric,
            $5::varchar,
            $6::numeric,
            $7::numeric,
            $8::integer,
            $9::numeric
          )
          RETURNING
            reading_id,
            device_id,
            home_id,
            recorded_at,
            consumption_liters,
            consumption_m3,
            activity,
            flow_rate_lpm,
            total_liters,
            pulses,
            sample_interval_seconds,
            created_at
        `,
        [
          resolvedDevice.device_id,
          resolvedDevice.home_id,
          recordedAt,
          consumptionLiters,
          reading.activity || 'General',
          flowRateLpm,
          totalLiters,
          pulses,
          sampleIntervalSeconds
        ]
      );

      await client.query('COMMIT');

      const savedReading = mapInsertedReading(insertResult.rows[0], deviceCode);

      this.logger.info('[MQTT] Lectura guardada en PostgreSQL', {
        readingId: savedReading.readingId,
        deviceCode: savedReading.deviceCode,
        deviceId: savedReading.deviceId,
        homeId: savedReading.homeId,
        consumptionLiters: savedReading.consumptionLiters,
        flowRateLpm: savedReading.flowRateLpm
      });

      return savedReading;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async saveFromMqtt(reading) {
    return this.save(reading);
  }
}

module.exports = { PostgresReadingIngestRepository };
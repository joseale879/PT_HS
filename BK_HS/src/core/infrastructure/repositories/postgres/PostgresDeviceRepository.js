const { Device } = require('../../../domain/entities/Device');
const { withTransaction } = require('../../../../infrastructure/db');
const { DeviceRepository } = require('../../../application/ports/repositories/DeviceRepository');

class PostgresDeviceRepository extends DeviceRepository {
  async recordMqttStatus({ deviceCode, connectivityStatus, eventAt, firmwareVersion, wifiRssiDbm, signalQuality, batteryLevel, lastIp }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT device_id, code, administrative_status, connectivity_status, last_connection_at
         FROM device.fn_record_device_status($1::varchar, $2::varchar, $3::timestamptz, $4::varchar,
           $5::integer, $6::integer, $7::integer, $8::varchar)`,
      [deviceCode, connectivityStatus, eventAt, firmwareVersion, wifiRssiDbm, signalQuality, batteryLevel, lastIp]
    ));
    return result.rows[0] || null;
  }

  async recordMqttActuatorStatus({ deviceCode, actuator, status, correlationId, reportedAt }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT device_id, home_id, actuator, status, command_id, command_status, reported_at
         FROM device.fn_record_actuator_status($1::varchar, $2::varchar, $3::varchar, $4::uuid, $5::timestamptz)`,
      [deviceCode, actuator, status, correlationId || null, reportedAt]
    ));
    return result.rows[0] || null;
  }

  async register(device, userId, homeId) {
    const deviceId = await withTransaction(userId, async (client) => {
      const result = await client.query(
        `SELECT device.fn_register_device_with_location($1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::decimal) AS device_id`,
        [device.code, device.name, device.type, device.location, device.manufacturer, device.model, device.alertThreshold]
      );
      const createdDeviceId = result.rows[0].device_id;
      await client.query(
        `INSERT INTO home.home_device (home_id, device_id) VALUES ($1::uuid, $2::uuid)`,
        [homeId, createdDeviceId]
      );
      return createdDeviceId;
    });

    return new Device({ ...device, id: deviceId });
  }

  async linkToHome({ userId, homeId, code }) {
    const result = await withTransaction(userId, async (client) => {
      const linked = await client.query(
        `SELECT device.fn_link_device_to_home($1::varchar, $2::uuid) AS device_id`,
        [code, homeId]
      );
      const deviceId = linked.rows[0]?.device_id;
      if (!deviceId) return null;

      return client.query(
        `SELECT d.device_id, d.code, d.name, d.type, d.location, d.manufacturer,
                d.model, d.umbral_alerta, d.status, d.firmware_version,
                d.connectivity_status, d.last_connection_at, d.wifi_rssi_dbm,
                d.signal_quality, d.battery_level
           FROM device.device d
          WHERE d.device_id = $1::uuid
          LIMIT 1`,
        [deviceId]
      );
    });

    const row = result?.rows?.[0];
    return row ? new Device({
      id: row.device_id,
      code: row.code,
      name: row.name,
      type: row.type,
      location: row.location,
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      connectivityStatus: row.connectivity_status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at,
      wifiRssiDbm: row.wifi_rssi_dbm,
      signalQuality: row.signal_quality,
      batteryLevel: row.battery_level
    }) : null;
  }

  async findByUserId(userId, homeId = null) {
    const result = await withTransaction(userId, (client) => client.query(
        `SELECT DISTINCT d.device_id, d.code, d.name, d.type, d.location, d.manufacturer,
              d.model, d.umbral_alerta, d.status, d.firmware_version,
              d.connectivity_status, d.last_connection_at, d.wifi_rssi_dbm,
              d.signal_quality, d.battery_level, d.created_at
         FROM device.device d
         JOIN home.home_device hd ON hd.device_id = d.device_id
         JOIN home.home_user hu ON hu.home_id = hd.home_id
        WHERE hu.user_account_id = $1::uuid
          AND hd.status = 'Active'
          AND ($2::uuid IS NULL OR hd.home_id = $2::uuid)
        ORDER BY d.created_at DESC`,
      [userId, homeId]
    ));

    return result.rows.map((row) => new Device({
      id: row.device_id,
      code: row.code,
      name: row.name,
      type: row.type,
      location: row.location,
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      connectivityStatus: row.connectivity_status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at,
      wifiRssiDbm: row.wifi_rssi_dbm,
      signalQuality: row.signal_quality,
      batteryLevel: row.battery_level
    }));
  }

  async findByIdForUser(deviceId, userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT d.device_id, d.code, d.name, d.type, d.location, d.manufacturer,
              d.model, d.umbral_alerta, d.status, d.firmware_version,
              d.connectivity_status, d.last_connection_at, d.wifi_rssi_dbm,
              d.signal_quality, d.battery_level
         FROM device.device d
         JOIN home.home_device hd ON hd.device_id = d.device_id
         JOIN home.home_user hu ON hu.home_id = hd.home_id
        WHERE d.device_id = $1::uuid
          AND hu.user_account_id = $2::uuid
          AND hd.status = 'Active'
        LIMIT 1`,
      [deviceId, userId]
    ));

    const row = result.rows[0];
    return row ? new Device({
      id: row.device_id,
      code: row.code,
      name: row.name,
      type: row.type,
      location: row.location,
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      connectivityStatus: row.connectivity_status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at,
      wifiRssiDbm: row.wifi_rssi_dbm,
      signalQuality: row.signal_quality,
      batteryLevel: row.battery_level
    }) : null;
  }

  async findLatestTelemetryForUser(deviceId, userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT sr.reading_id, sr.device_id, sr.home_id, sr.recorded_at,
              sr.measured_at, sr.received_at, sr.consumption_liters,
              sr.flow_rate_lpm, sr.total_liters, sr.pulses,
              sr.sample_interval_seconds, sr.wifi_rssi_dbm,
              sr.signal_quality, sr.battery_level, sr.voltage,
              sr.temperature, sr.mqtt_message_id
         FROM consumption.sensor_reading sr
         JOIN device.device d ON d.device_id = sr.device_id
         JOIN home.home_device hd ON hd.device_id = d.device_id
         JOIN home.home_user hu ON hu.home_id = hd.home_id
        WHERE sr.device_id = $1::uuid
          AND hu.user_account_id = $2::uuid
          AND hd.status = 'Active'
        ORDER BY COALESCE(sr.measured_at, sr.recorded_at) DESC,
                 sr.received_at DESC
        LIMIT 1`,
      [deviceId, userId]
    ));

    const row = result.rows[0];
    if (!row) return null;
    return {
      readingId: row.reading_id,
      deviceId: row.device_id,
      homeId: row.home_id,
      recordedAt: row.recorded_at,
      measuredAt: row.measured_at,
      receivedAt: row.received_at,
      consumptionLiters: Number(row.consumption_liters || 0),
      flowRateLpm: row.flow_rate_lpm === null ? null : Number(row.flow_rate_lpm),
      totalLiters: row.total_liters === null ? null : Number(row.total_liters),
      pulses: row.pulses === null ? null : Number(row.pulses),
      sampleIntervalSeconds: row.sample_interval_seconds === null ? null : Number(row.sample_interval_seconds),
      wifiRssiDbm: row.wifi_rssi_dbm === null ? null : Number(row.wifi_rssi_dbm),
      signalQuality: row.signal_quality === null ? null : Number(row.signal_quality),
      batteryLevel: row.battery_level === null ? null : Number(row.battery_level),
      voltage: row.voltage === null ? null : Number(row.voltage),
      temperature: row.temperature === null ? null : Number(row.temperature),
      mqttMessageId: row.mqtt_message_id
    };
  }

  async listTelemetryForUser({ deviceId, userId, from, to, sort, order, limit, offset }) {
    const sortColumns = {
      measuredAt: 'COALESCE(sr.measured_at, sr.recorded_at)',
      receivedAt: 'sr.received_at',
      flowRateLpm: 'sr.flow_rate_lpm',
      consumptionLiters: 'sr.consumption_liters'
    };
    const orderBy = sortColumns[sort] || sortColumns.measuredAt;
    const direction = order === 'asc' ? 'ASC' : 'DESC';
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT sr.reading_id, sr.device_id, sr.home_id, sr.recorded_at,
              sr.measured_at, sr.received_at, sr.consumption_liters,
              sr.flow_rate_lpm, sr.total_liters, sr.pulses,
              sr.sample_interval_seconds, sr.wifi_rssi_dbm,
              sr.signal_quality, sr.battery_level, sr.voltage,
              sr.temperature, sr.mqtt_message_id,
              count(*) OVER() AS total_count
         FROM consumption.sensor_reading sr
         JOIN device.device d ON d.device_id = sr.device_id
         JOIN home.home_device hd ON hd.device_id = d.device_id
         JOIN home.home_user hu ON hu.home_id = hd.home_id
        WHERE sr.device_id = $1::uuid
          AND hu.user_account_id = $2::uuid
          AND hd.status = 'Active'
          AND ($3::timestamptz IS NULL OR COALESCE(sr.measured_at, sr.recorded_at) >= $3::timestamptz)
          AND ($4::timestamptz IS NULL OR COALESCE(sr.measured_at, sr.recorded_at) <= $4::timestamptz)
        ORDER BY ${orderBy} ${direction}, sr.reading_id DESC
        LIMIT $5::integer OFFSET $6::integer`,
      [deviceId, userId, from, to, limit, offset]
    ));

    return {
      items: result.rows.map((row) => ({
        readingId: row.reading_id,
        deviceId: row.device_id,
        homeId: row.home_id,
        recordedAt: row.recorded_at,
        measuredAt: row.measured_at,
        receivedAt: row.received_at,
        consumptionLiters: Number(row.consumption_liters || 0),
        flowRateLpm: row.flow_rate_lpm === null ? null : Number(row.flow_rate_lpm),
        totalLiters: row.total_liters === null ? null : Number(row.total_liters),
        pulses: row.pulses === null ? null : Number(row.pulses),
        sampleIntervalSeconds: row.sample_interval_seconds === null ? null : Number(row.sample_interval_seconds),
        wifiRssiDbm: row.wifi_rssi_dbm === null ? null : Number(row.wifi_rssi_dbm),
        signalQuality: row.signal_quality === null ? null : Number(row.signal_quality),
        batteryLevel: row.battery_level === null ? null : Number(row.battery_level),
        voltage: row.voltage === null ? null : Number(row.voltage),
        temperature: row.temperature === null ? null : Number(row.temperature),
        mqttMessageId: row.mqtt_message_id
      })),
      total: Number(result.rows[0]?.total_count || 0)
    };
  }

  async updateForUser({ userId, deviceId, name, location, manufacturer, model, alertThreshold }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE device.device
          SET name = COALESCE($2::varchar, name),
              location = COALESCE($3::varchar, location),
              manufacturer = COALESCE($4::varchar, manufacturer),
              model = COALESCE($5::varchar, model),
              umbral_alerta = COALESCE($6::decimal, umbral_alerta),
              updated_at = now()
        WHERE device_id = $1::uuid
        RETURNING device_id, code, name, type, location, manufacturer, model,
                  umbral_alerta, status, firmware_version, last_connection_at`,
      [deviceId, name ?? null, location ?? null, manufacturer ?? null, model ?? null, alertThreshold ?? null]
    ));

    const row = result.rows[0];
    return row ? new Device({
      id: row.device_id,
      code: row.code,
      name: row.name,
      type: row.type,
      location: row.location,
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at
    }) : null;
  }

  async updateConfigForUser({ userId, deviceId, calibrationFactor, calibrationOffset, reason }) {
    const result = await withTransaction(userId, async (client) => {
      const current = await client.query(
        `SELECT calibration_factor, calibration_offset
           FROM device.device
          WHERE device_id = $1::uuid`,
        [deviceId]
      );
      if (!current.rowCount) return null;

      const previous = current.rows[0];
      const updated = await client.query(
        `UPDATE device.device
            SET calibration_factor = $2::decimal,
                calibration_offset = $3::decimal,
                last_calibration_at = now(),
                updated_at = now()
          WHERE device_id = $1::uuid
          RETURNING device_id, code, name, type, location, manufacturer, model,
                    umbral_alerta, status, firmware_version, last_connection_at`,
        [deviceId, calibrationFactor, calibrationOffset]
      );
      if (!updated.rowCount) return null;

      await client.query(
        `INSERT INTO device.calibration_history
          (device_id, previous_factor, new_factor, previous_offset, new_offset, reason, performed_by)
         VALUES ($1::uuid, $2::decimal, $3::decimal, $4::decimal, $5::decimal, $6::varchar, $7::uuid)`,
        [deviceId, previous.calibration_factor, calibrationFactor, previous.calibration_offset, calibrationOffset, reason, userId]
      );
      return updated.rows[0];
    });

    if (!result) return null;
    return new Device({
      id: result.device_id,
      code: result.code,
      name: result.name,
      type: result.type,
      location: result.location,
      manufacturer: result.manufacturer,
      model: result.model,
      alertThreshold: result.umbral_alerta,
      status: result.status,
      firmwareVersion: result.firmware_version,
      lastConnectionAt: result.last_connection_at
    });
  }

  async updateStatusForUser({ userId, deviceId, status, reason }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT * FROM device.fn_update_device_status($1::uuid, $2::varchar, $3::varchar)`,
      [deviceId, status, reason]
    ));

    const row = result.rows[0];
    if (!row) return null;
    return new Device({
      id: row.device_id,
      code: row.code,
      name: row.name,
      type: row.type,
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at
    });
  }

  async unlinkFromHome({ userId, deviceId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `DELETE FROM home.home_device
        WHERE device_id = $1::uuid
          AND home_id = $2::uuid
        RETURNING home_id, device_id`,
      [deviceId, homeId]
    ));

    return result.rows[0] || null;
  }
}

module.exports = { PostgresDeviceRepository };

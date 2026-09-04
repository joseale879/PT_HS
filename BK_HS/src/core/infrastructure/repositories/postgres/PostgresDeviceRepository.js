const { Device } = require('../../../domain/entities/Device');
const { withTransaction } = require('../../../../infrastructure/db');
const { DeviceRepository } = require('../../../application/ports/repositories/DeviceRepository');

class PostgresDeviceRepository extends DeviceRepository {
  async register(device, userId, homeId) {
    const deviceId = await withTransaction(userId, async (client) => {
      const result = await client.query(
        `SELECT device.fn_register_device($1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, $6::decimal) AS device_id`,
        [device.code, device.name, device.type, device.manufacturer, device.model, device.alertThreshold]
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

  async findByUserId(userId, homeId = null) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT DISTINCT d.device_id, d.code, d.name, d.type, d.manufacturer,
              d.model, d.umbral_alerta, d.status, d.firmware_version,
              d.last_connection_at, d.created_at
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
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at
    }));
  }

  async findByIdForUser(deviceId, userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT d.device_id, d.code, d.name, d.type, d.manufacturer,
              d.model, d.umbral_alerta, d.status, d.firmware_version,
              d.last_connection_at
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
      manufacturer: row.manufacturer,
      model: row.model,
      alertThreshold: row.umbral_alerta,
      status: row.status,
      firmwareVersion: row.firmware_version,
      lastConnectionAt: row.last_connection_at
    }) : null;
  }

  async updateForUser({ userId, deviceId, name, manufacturer, model, alertThreshold }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE device.device
          SET name = COALESCE($2::varchar, name),
              manufacturer = COALESCE($3::varchar, manufacturer),
              model = COALESCE($4::varchar, model),
              umbral_alerta = COALESCE($5::decimal, umbral_alerta),
              updated_at = now()
        WHERE device_id = $1::uuid
        RETURNING device_id, code, name, type, manufacturer, model,
                  umbral_alerta, status, firmware_version, last_connection_at`,
      [deviceId, name ?? null, manufacturer ?? null, model ?? null, alertThreshold ?? null]
    ));

    const row = result.rows[0];
    return row ? new Device({
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
          RETURNING device_id, code, name, type, manufacturer, model,
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

const { withTransaction } = require('../../../../infrastructure/db');
const { ActuatorRepository } = require('../../../application/ports/repositories/ActuatorRepository');

const commandSelect = `
  SELECT ac.command_id, ac.device_id, d.code AS device_code, ac.home_id,
         ac.requested_by, ac.actuator, ac.command, ac.correlation_id,
         ac.status, ac.requested_at, ac.published_at, ac.acknowledged_at,
         ac.completed_at, ac.error_message
    FROM device.actuator_command ac
    JOIN device.device d ON d.device_id = ac.device_id`;

function mapCommand(row) {
  return {
    commandId: row.command_id,
    deviceId: row.device_id,
    deviceCode: row.device_code,
    homeId: row.home_id,
    requestedBy: row.requested_by,
    actuator: row.actuator,
    command: row.command,
    correlationId: row.correlation_id,
    status: row.status,
    requestedAt: row.requested_at,
    publishedAt: row.published_at,
    acknowledgedAt: row.acknowledged_at,
    completedAt: row.completed_at,
    errorMessage: row.error_message
  };
}

function mapState(row) {
  return {
    deviceId: row.device_id,
    deviceCode: row.device_code,
    homeId: row.home_id,
    actuator: row.actuator,
    status: row.status,
    lastReportedAt: row.last_reported_at,
    updatedAt: row.updated_at
  };
}

class PostgresActuatorRepository extends ActuatorRepository {
  async createPending({ userId, deviceId, actuator, command, correlationId }) {
    const result = await withTransaction(userId, async (client) => {
      const device = await client.query(
        `SELECT d.device_id, d.code, hd.home_id
           FROM device.device d
           JOIN home.home_device hd ON hd.device_id = d.device_id
           JOIN home.home_user hu ON hu.home_id = hd.home_id
          WHERE d.device_id = $1::uuid
            AND d.status = 'Active'
            AND hd.status = 'Active'
            AND hu.user_account_id = $2::uuid
          ORDER BY hd.installed_at DESC
          LIMIT 1`,
        [deviceId, userId]
      );
      if (!device.rowCount) return null;

      const row = await client.query(
        `INSERT INTO device.actuator_command
          (device_id, home_id, requested_by, actuator, command, correlation_id)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4::varchar, $5::varchar, $6::uuid)
         RETURNING command_id, device_id, home_id, requested_by, actuator,
                   command, correlation_id, status, requested_at,
                   published_at, acknowledged_at, completed_at, error_message`,
        [deviceId, device.rows[0].home_id, userId, actuator, command, correlationId]
      );
      return { row: row.rows[0], deviceCode: device.rows[0].code };
    });

    return result ? { ...mapCommand({ ...result.row, device_code: result.deviceCode }) } : null;
  }

  async markPublished({ userId, commandId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `${commandSelect}
       WHERE ac.command_id = $1::uuid
         AND ac.status = 'Pending'
       FOR UPDATE`,
      [commandId]
    ));
    if (!result.rowCount) return this.getById({ userId, commandId });

    await withTransaction(userId, (client) => client.query(
      `UPDATE device.actuator_command
          SET status = 'Published', published_at = COALESCE(published_at, now())
        WHERE command_id = $1::uuid AND status = 'Pending'`,
      [commandId]
    ));
    return this.getById({ userId, commandId });
  }

  async markFailed({ userId, commandId, errorMessage }) {
    const safeMessage = String(errorMessage || 'No fue posible publicar el comando').slice(0, 500);
    await withTransaction(userId, (client) => client.query(
      `UPDATE device.actuator_command
          SET status = CASE WHEN status IN ('Pending', 'Published') THEN 'Failed' ELSE status END,
              error_message = CASE WHEN status IN ('Pending', 'Published') THEN $2::varchar ELSE error_message END,
              completed_at = CASE WHEN status IN ('Pending', 'Published') THEN COALESCE(completed_at, now()) ELSE completed_at END
        WHERE command_id = $1::uuid`,
      [commandId, safeMessage]
    ));
    return this.getById({ userId, commandId });
  }

  async expirePendingCommands({ timeoutSeconds, batchSize }) {
    const result = await withTransaction(null, (client) => client.query(
      'SELECT device.fn_timeout_actuator_commands($1::integer, $2::integer) AS expired_count',
      [timeoutSeconds, batchSize]
    ));
    return Number(result.rows[0]?.expired_count || 0);
  }

  async getById({ userId, commandId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `${commandSelect} WHERE ac.command_id = $1::uuid LIMIT 1`, [commandId]
    ));
    return result.rows[0] ? mapCommand(result.rows[0]) : null;
  }

  async listStates({ userId, homeId = null }) {
    const values = [userId];
    const homeCondition = homeId ? 'AND s.home_id = $2::uuid' : '';
    if (homeId) values.push(homeId);
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT s.device_id, d.code AS device_code, s.home_id, s.actuator,
              s.status, s.last_reported_at, s.updated_at
         FROM device.actuator_state s
         JOIN device.device d ON d.device_id = s.device_id
         JOIN home.home_user hu ON hu.home_id = s.home_id
        WHERE hu.user_account_id = $1::uuid ${homeCondition}
        ORDER BY d.code, s.actuator`,
      values
    ));
    return result.rows.map(mapState);
  }

  async getStatesByDevice({ userId, deviceId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT s.device_id, d.code AS device_code, s.home_id, s.actuator,
              s.status, s.last_reported_at, s.updated_at
         FROM device.actuator_state s
         JOIN device.device d ON d.device_id = s.device_id
         JOIN home.home_user hu ON hu.home_id = s.home_id
        WHERE s.device_id = $1::uuid
          AND hu.user_account_id = $2::uuid
        ORDER BY s.actuator`,
      [deviceId, userId]
    ));
    return result.rows.map(mapState);
  }

  async listCommands({ userId, homeId = null, status = null }) {
    const values = [userId];
    const conditions = ['hu.user_account_id = $1::uuid'];
    if (homeId) {
      values.push(homeId);
      conditions.push(`ac.home_id = $${values.length}::uuid`);
    }
    if (status) {
      values.push(status);
      conditions.push(`ac.status = $${values.length}::varchar`);
    }
    const result = await withTransaction(userId, (client) => client.query(
      `${commandSelect}
       JOIN home.home_user hu ON hu.home_id = ac.home_id
        WHERE ${conditions.join(' AND ')}
        ORDER BY ac.requested_at DESC`,
      values
    ));
    return result.rows.map(mapCommand);
  }

  async recordMqttStatus({ deviceCode, actuator, status, correlationId, reportedAt }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT device_id, home_id, actuator, status, command_id, command_status, reported_at
         FROM device.fn_record_actuator_status($1::varchar, $2::varchar, $3::varchar, $4::uuid, $5::timestamptz)`,
      [deviceCode, actuator, status, correlationId || null, reportedAt]
    ));
    return result.rows[0] || null;
  }
}

module.exports = { PostgresActuatorRepository };

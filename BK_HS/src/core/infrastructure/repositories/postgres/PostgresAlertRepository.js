const { withTransaction } = require('../../../../infrastructure/db');

class PostgresAlertRepository {
  mapThreshold(row) {
    return { configId: row.config_id, homeId: row.home_id, dailyLimit: row.daily_limit === null ? null : Number(row.daily_limit), monthlyLimit: row.monthly_limit === null ? null : Number(row.monthly_limit), active: row.active, updatedAt: row.updated_at, updatedBy: row.updated_by };
  }

  async findThresholdConfiguration({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT config_id, home_id, daily_limit, monthly_limit, active, updated_at, updated_by
         FROM alert_rate.threshold_configuration WHERE home_id = $1::uuid`, [homeId]
    ));
    return result.rows[0] ? this.mapThreshold(result.rows[0]) : null;
  }

  async saveThresholdConfiguration({ userId, homeId, dailyLimit, monthlyLimit, active }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO alert_rate.threshold_configuration (home_id, daily_limit, monthly_limit, active, updated_by)
       VALUES ($1::uuid, $2::decimal, $3::decimal, $4::boolean, $5::uuid)
       ON CONFLICT (home_id) DO UPDATE SET daily_limit = EXCLUDED.daily_limit, monthly_limit = EXCLUDED.monthly_limit, active = EXCLUDED.active, updated_at = now(), updated_by = EXCLUDED.updated_by
       RETURNING config_id, home_id, daily_limit, monthly_limit, active, updated_at, updated_by`,
      [homeId, dailyLimit, monthlyLimit, active, userId]
    ));
    return this.mapThreshold(result.rows[0]);
  }

  async deleteThresholdConfiguration({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      'DELETE FROM alert_rate.threshold_configuration WHERE home_id = $1::uuid RETURNING config_id', [homeId]
    ));
    if (!result.rows[0]) { const error = new Error('Configuración de umbrales no encontrada'); error.status = 404; throw error; }
  }

  mapRule(row) {
    return { ruleId: row.rule_id, homeId: row.home_id, alertType: row.alert_type, threshold: Number(row.threshold), unit: row.unit, active: row.active, createdAt: row.created_at, updatedAt: row.updated_at };
  }

  async createRule({ userId, homeId, alertType, threshold, unit, active }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO alert_rate.alert_rule (home_id, alert_type, threshold, unit, active, created_by)
       VALUES ($1::uuid, $2::varchar, $3::decimal, $4::varchar, $5::boolean, $6::uuid)
       RETURNING rule_id, home_id, alert_type, threshold, unit, active, created_at, updated_at`,
      [homeId, alertType, threshold, unit, active, userId]
    ));
    return this.mapRule(result.rows[0]);
  }

  async listRules({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT rule_id, home_id, alert_type, threshold, unit, active, created_at, updated_at
         FROM alert_rate.alert_rule WHERE home_id = $1::uuid ORDER BY created_at DESC`, [homeId]
    ));
    return result.rows.map((row) => this.mapRule(row));
  }

  async listHistory({ userId, homeId, status, from, to }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT event_id, rule_id, home_id, message, detected_value, generated_at, status, read_at, dismissed_at
         FROM alert_rate.alert_event
        WHERE home_id = $1::uuid
          AND ($2::varchar IS NULL OR status = $2::varchar)
          AND ($3::date IS NULL OR generated_at >= $3::date)
          AND ($4::date IS NULL OR generated_at < ($4::date + INTERVAL '1 day'))
        ORDER BY generated_at DESC`,
      [homeId, status || null, from || null, to || null]
    ));
    return result.rows.map((row) => ({
      alertId: row.event_id, ruleId: row.rule_id, homeId: row.home_id, message: row.message,
      detectedValue: row.detected_value === null ? null : Number(row.detected_value), generatedAt: row.generated_at,
      status: row.status, readAt: row.read_at, dismissedAt: row.dismissed_at
    }));
  }

  async updateRule({ userId, ruleId, alertType, threshold, unit, active }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE alert_rate.alert_rule
          SET alert_type = COALESCE($2::varchar, alert_type),
              threshold = COALESCE($3::decimal, threshold),
              unit = COALESCE($4::varchar, unit),
              active = COALESCE($5::boolean, active),
              updated_at = now()
        WHERE rule_id = $1::uuid
        RETURNING rule_id, home_id, alert_type, threshold, unit, active, created_at, updated_at`,
      [ruleId, alertType ?? null, threshold ?? null, unit ?? null, active ?? null]
    ));
    if (!result.rows[0]) { const error = new Error('Regla de alerta no encontrada'); error.status = 404; throw error; }
    return this.mapRule(result.rows[0]);
  }

  async deleteRule({ userId, ruleId }) {
    const result = await withTransaction(userId, (client) => client.query(
      'DELETE FROM alert_rate.alert_rule WHERE rule_id = $1::uuid RETURNING rule_id', [ruleId]
    ));
    if (!result.rows[0]) { const error = new Error('Regla de alerta no encontrada'); error.status = 404; throw error; }
  }

  async findPendingByHome({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT home_id, pending_count, last_alert_at, refreshed_at
         FROM alert_rate.fn_get_home_pending_alerts($1::uuid)`, [homeId]
    ));
    const row = result.rows[0];
    return {
      homeId,
      pendingCount: Number(row?.pending_count || 0),
      lastAlertAt: row?.last_alert_at || null,
      refreshedAt: row?.refreshed_at || null
    };
  }

  async updateStatus({ userId, alertId, status }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE alert_rate.alert_event
          SET status = $2::varchar,
              read_at = CASE WHEN $2::varchar = 'Read' THEN COALESCE(read_at, now()) ELSE read_at END,
              dismissed_at = CASE WHEN $2::varchar = 'Dismissed' THEN COALESCE(dismissed_at, now()) ELSE dismissed_at END
        WHERE event_id = $1::uuid
        RETURNING event_id, home_id, status, read_at, dismissed_at`,
      [alertId, status]
    ));
    const row = result.rows[0];
    if (!row) {
      const error = new Error('Alerta no encontrada');
      error.status = 404;
      throw error;
    }
    return {
      alertId: row.event_id,
      homeId: row.home_id,
      status: row.status,
      readAt: row.read_at,
      dismissedAt: row.dismissed_at
    };
  }
}

module.exports = { PostgresAlertRepository };

const { withTransaction } = require('../../../../infrastructure/db');
const { ReportRepository } = require('../../../application/ports/repositories/ReportRepository');

function map(row) {
  return {
    reportId: row.report_id,
    userId: row.user_account_id,
    homeId: row.home_id,
    type: row.type,
    category: row.category,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    includeCharts: row.include_charts,
    storagePath: row.storage_path,
    sizeBytes: row.size_bytes == null ? null : Number(row.size_bytes),
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    availableUntil: row.available_until
  };
}

class PostgresReportRepository extends ReportRepository {
  async createGenerating({ userId, homeId, type, category, periodStart, periodEnd }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO analytics_support.generated_report(
         user_account_id, home_id, type, category, period_start, period_end, status
       ) VALUES ($1::uuid, $2::uuid, $3::varchar, $4::varchar, $5::date, $6::date, 'Generating')
       RETURNING *`,
      [userId, homeId, type, category, periodStart, periodEnd]
    ));
    return map(result.rows[0]);
  }

  async markReady({ userId, reportId, storagePath, sizeBytes }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE analytics_support.generated_report
          SET storage_path = $3::varchar,
              size_bytes = $4::integer,
              status = 'Ready',
              error_message = NULL
        WHERE report_id = $1::uuid
          AND user_account_id = $2::uuid
        RETURNING *`,
      [reportId, userId, storagePath, sizeBytes]
    ));
    if (!result.rowCount) {
      const error = new Error('Reporte no encontrado');
      error.status = 404;
      throw error;
    }
    return map(result.rows[0]);
  }

  async markError({ userId, reportId, errorMessage }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE analytics_support.generated_report
          SET status = 'Error',
              error_message = $3::text
        WHERE report_id = $1::uuid
          AND user_account_id = $2::uuid
        RETURNING *`,
      [reportId, userId, String(errorMessage || 'No fue posible generar el reporte').slice(0, 1000)]
    ));
    return result.rowCount ? map(result.rows[0]) : null;
  }

  async listForUser({ userId, homeId, type, status, limit, offset }) {
    const values = [userId];
    const conditions = ['user_account_id = $1::uuid'];
    if (homeId) {
      values.push(homeId);
      conditions.push(`home_id = $${values.length}::uuid`);
    }
    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}::varchar`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}::varchar`);
    }
    values.push(limit, offset);
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT *, count(*) OVER() AS total_count
         FROM analytics_support.generated_report
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
        LIMIT $${values.length - 1}::integer OFFSET $${values.length}::integer`,
      values
    ));
    return {
      items: result.rows.map(map),
      total: Number(result.rows[0]?.total_count || 0)
    };
  }

  async findForUser({ userId, reportId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT *
         FROM analytics_support.generated_report
        WHERE report_id = $1::uuid
          AND user_account_id = $2::uuid
        LIMIT 1`,
      [reportId, userId]
    ));
    if (!result.rowCount) {
      const error = new Error('Reporte no encontrado');
      error.status = 404;
      throw error;
    }
    return map(result.rows[0]);
  }
}

module.exports = { PostgresReportRepository };

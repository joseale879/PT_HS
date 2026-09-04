const { withTransaction } = require('../../../../infrastructure/db');
const { AuditRepository } = require('../../../application/ports/repositories/AuditRepository');

class PostgresAuditRepository extends AuditRepository {
  async list({ userId, action, tableName, from, to, limit, offset }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT * FROM user_account.fn_list_audit_logs(
         $1::varchar, $2::varchar, $3::timestamptz, $4::timestamptz, $5::integer, $6::integer
       )`,
      [action, tableName, from, to, limit, offset]
    ));

    const items = result.rows.map((row) => ({
      auditId: row.audit_id,
      userId: row.user_account_id,
      action: row.action,
      tableName: row.table_name,
      recordId: row.record_id,
      oldValue: row.old_value,
      newValue: row.new_value,
      description: row.description,
      sourceIp: row.source_ip,
      userAgent: row.user_agent,
      createdAt: row.created_at
    }));

    return { items, total: Number(result.rows[0]?.total_count || 0) };
  }
}

module.exports = { PostgresAuditRepository };

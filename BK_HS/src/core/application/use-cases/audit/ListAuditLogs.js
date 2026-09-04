const { getPagination } = require('../../../../shared/http');

const AUDIT_ACTIONS = new Set(['INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ERROR', 'EXPORT', 'IMPORT']);

function optionalText(value, field, max) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > max) {
    const error = new Error(`${field} no es valido`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    const error = new Error(`${field} no es valido`);
    error.status = 400;
    throw error;
  }
  return new Date(value).toISOString();
}

class ListAuditLogs {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, action, tableName, from, to, page, pageSize }) {
    const pagination = getPagination({ page, pageSize });
    const normalizedAction = optionalText(action, 'action', 20)?.toUpperCase() || null;
    if (normalizedAction && !AUDIT_ACTIONS.has(normalizedAction)) {
      const error = new Error('action no es valido');
      error.status = 400;
      throw error;
    }

    const fromDate = optionalDate(from, 'from');
    const toDate = optionalDate(to, 'to');
    if (fromDate && toDate && fromDate >= toDate) {
      const error = new Error('from debe ser anterior a to');
      error.status = 400;
      throw error;
    }

    return this.repository.list({
      userId,
      action: normalizedAction,
      tableName: optionalText(tableName, 'tableName', 100),
      from: fromDate,
      to: toDate,
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize,
      page: pagination.page,
      pageSize: pagination.pageSize
    });
  }
}

module.exports = { ListAuditLogs };

const { getPagination } = require('../../../../shared/http');

const REPORT_TYPES = new Set(['pdf', 'excel']);
const REPORT_STATUSES = new Set(['Generating', 'Ready', 'Error']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value, field) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
    const error = new Error(`${field} no es válido`);
    error.status = 400;
    throw error;
  }
}

class ListGeneratedReports {
  constructor({ repository }) { this.repository = repository; }

  async execute({ userId, homeId, page, pageSize, type, status }) {
    uuid(userId, 'userId');
    if (homeId !== undefined && homeId !== null && homeId !== '') uuid(homeId, 'homeId');
    if (type !== undefined && type !== null && !REPORT_TYPES.has(type)) {
      const error = new Error('type de reporte no es válido');
      error.status = 400;
      throw error;
    }
    if (status !== undefined && status !== null && !REPORT_STATUSES.has(status)) {
      const error = new Error('status de reporte no es válido');
      error.status = 400;
      throw error;
    }
    const pagination = getPagination({ page, pageSize });
    return this.repository.listForUser({
      userId,
      homeId: homeId || null,
      type: type || null,
      status: status || null,
      limit: pagination.pageSize,
      offset: (pagination.page - 1) * pagination.pageSize
    }).then((result) => ({
      ...result,
      pagination: {
        ...pagination,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.pageSize)
      }
    }));
  }
}

class GetGeneratedReport {
  constructor({ repository }) { this.repository = repository; }

  async execute({ userId, reportId }) {
    uuid(userId, 'userId');
    uuid(reportId, 'reportId');
    return this.repository.findForUser({ userId, reportId });
  }
}

module.exports = { ListGeneratedReports, GetGeneratedReport };

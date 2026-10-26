const { getPagination } = require('../../../../shared/http');

const SORT_FIELDS = new Set(['measuredAt', 'receivedAt', 'flowRateLpm', 'consumptionLiters']);

class ListDeviceTelemetry {
  constructor({ deviceRepository }) {
    this.deviceRepository = deviceRepository;
  }

  execute({ userId, deviceId, page, pageSize, from, to, sort = 'measuredAt', order = 'desc' }) {
    if (!userId) throw new Error('El usuario autenticado es obligatorio');
    this.assertUuid(deviceId, 'deviceId');

    if (!SORT_FIELDS.has(sort)) {
      throw this.badRequest('sort no es valido');
    }
    if (!['asc', 'desc'].includes(order)) {
      throw this.badRequest('order debe ser asc o desc');
    }

    const fromDate = this.optionalDate(from, 'from');
    const toDate = this.optionalDate(to, 'to');
    if (fromDate && toDate && fromDate > toDate) {
      throw this.badRequest('from no puede ser posterior a to');
    }

    const pagination = getPagination({ page, pageSize });
    return this.deviceRepository.listTelemetryForUser({
      userId,
      deviceId,
      from: fromDate,
      to: toDate,
      sort,
      order,
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

  assertUuid(value, field) {
    if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw this.badRequest(`${field} no es valido`);
    }
  }

  optionalDate(value, field) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
      throw this.badRequest(`${field} no es valido`);
    }
    return new Date(value).toISOString();
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = { ListDeviceTelemetry };

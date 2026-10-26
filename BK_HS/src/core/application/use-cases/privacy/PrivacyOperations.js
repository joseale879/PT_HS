const { getPagination } = require('../../../../shared/http');

const CONSENT_TYPES = new Set(['policy_privacy', 'terms_of_use', 'marketing', 'sensitive_data', 'share_data']);
const REQUEST_TYPES = new Set(['access', 'rectification', 'cancellation', 'opposition', 'portability']);
const REQUEST_STATUSES = new Set(['Received', 'In_progress', 'Resolved', 'Rejected']);

function uuid(value, field) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    const error = new Error(`${field} no es válido`); error.status = 400; throw error;
  }
}

function text(value, field, max, { optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === '')) return null;
  if (typeof value !== 'string' || value.trim().length === 0 || value.trim().length > max) {
    const error = new Error(`${field} no es válido`); error.status = 400; throw error;
  }
  return value.trim();
}

class ExportUserData {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId }) { uuid(userId, 'userId'); return this.repository.exportUserData({ userId }); }
}

class ListConsents {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId }) { uuid(userId, 'userId'); return this.repository.listConsents({ userId }); }
}

class CreateConsent {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, type, documentVersion, accepted, sourceIp, userAgent }) {
    uuid(userId, 'userId');
    if (!CONSENT_TYPES.has(type)) throw this.error('type de consentimiento no es válido', 400);
    const version = text(documentVersion, 'documentVersion', 20);
    if (accepted !== true) throw this.error('Solo se pueden registrar consentimientos aceptados', 400);
    return this.repository.createConsent({ userId, type, documentVersion: version, accepted, sourceIp, userAgent });
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

class CreateArcoRequest {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, type, description }) {
    uuid(userId, 'userId');
    if (!REQUEST_TYPES.has(type)) throw this.error('type de solicitud no es válido', 400);
    return this.repository.createArcoRequest({ userId, type, description: text(description, 'description', 5000, { optional: true }) });
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

class ListArcoRequests {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, status, type, page, pageSize, managed = false }) {
    uuid(userId, 'userId');
    if (status !== undefined && status !== null && !REQUEST_STATUSES.has(status)) throw this.error('status no es válido', 400);
    if (type !== undefined && type !== null && !REQUEST_TYPES.has(type)) throw this.error('type de solicitud no es válido', 400);
    const pagination = getPagination({ page, pageSize });
    return this.repository.listArcoRequests({ userId, status: status || null, type: type || null, managed, limit: pagination.pageSize, offset: (pagination.page - 1) * pagination.pageSize }).then((result) => ({ ...result, pagination: { ...pagination, total: result.total, totalPages: Math.ceil(result.total / pagination.pageSize) } }));
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

class GetArcoRequest {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, requestId }) { uuid(userId, 'userId'); uuid(requestId, 'requestId'); return this.repository.getArcoRequest({ userId, requestId }); }
}

class UpdateArcoRequest {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, requestId, status, answer }) {
    uuid(userId, 'userId'); uuid(requestId, 'requestId');
    if (!REQUEST_STATUSES.has(status) || status === 'Received') throw this.error('status de gestión no es válido', 400);
    const normalizedAnswer = text(answer, 'answer', 10000, { optional: status !== 'Resolved' && status !== 'Rejected' });
    if ((status === 'Resolved' || status === 'Rejected') && !normalizedAnswer) throw this.error('answer es obligatorio al cerrar la solicitud', 400);
    return this.repository.updateArcoRequest({ userId, requestId, status, answer: normalizedAnswer });
  }
  error(message, status) { const error = new Error(message); error.status = status; return error; }
}

module.exports = { ExportUserData, ListConsents, CreateConsent, CreateArcoRequest, ListArcoRequests, GetArcoRequest, UpdateArcoRequest };

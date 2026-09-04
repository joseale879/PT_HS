const { randomUUID } = require('node:crypto');

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function notFound(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

function errorHandler(error, req, res, _next) {
  const status = error.status || databaseErrorStatus(error) || (error instanceof SyntaxError ? 400 : 500);
  const requestId = req?.id || req?.headers?.['x-request-id'] || randomUUID();
  const message = status === 500
    ? 'Error interno del servidor'
    : error instanceof SyntaxError
      ? 'El cuerpo de la solicitud contiene JSON inválido'
      : databaseErrorMessage(error) || error.message;
  if (status === 500) console.error(error);
  if (typeof res.setHeader === 'function') res.setHeader('X-Request-Id', requestId);
  res.status(status).json({ error: { code: errorCode(status), message }, meta: { requestId } });
}

function errorCode(status) {
  return ({ 400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT', 422: 'UNPROCESSABLE_ENTITY', 429: 'TOO_MANY_REQUESTS', 500: 'INTERNAL_SERVER_ERROR' })[status] || 'HTTP_ERROR';
}

function getPagination(query = {}) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(Number.parseInt(query.pageSize, 10) || 20, 1), 100);
  return { page, pageSize };
}

function paginate(items, query = {}, { sortFields = [], filter = null } = {}) {
  const { page, pageSize } = getPagination(query);
  let result = Array.isArray(items) ? [...items] : [];
  if (filter) result = result.filter(filter);
  const sort = sortFields.includes(query.sort) ? query.sort : null;
  if (sort) {
    const direction = query.order === 'asc' ? 1 : -1;
    result.sort((a, b) => String(a[sort] ?? '').localeCompare(String(b[sort] ?? ''), 'es', { numeric: true }) * direction);
  }
  const total = result.length;
  const start = (page - 1) * pageSize;
  return {
    items: result.slice(start, start + pageSize),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
  };
}

function databaseErrorStatus(error) {
  const statuses = {
    '22P02': 400,
    '22001': 400,
    '23502': 400,
    '23503': 409,
    '23505': 409,
    '23514': 400,
    '42501': 403
  };
  if (statuses[error.code]) return statuses[error.code];
  if (error.code === 'P0001') {
    const message = String(error.message || '').toLowerCase();
    if (message.includes('refresh token') || message.includes('token de recuperación')) return 401;
    if (message.includes('permiso') || message.includes('puede gestionar') || message.includes('puede consultar')) return 403;
    return 400;
  }
  return error.message?.includes('debe') || error.message?.includes('obligatorio') ? 400 : null;
}

function databaseErrorMessage(error) {
  const messages = {
    '22P02': 'El formato de un dato no es válido',
    '22001': 'Un dato supera la longitud permitida',
    '23502': 'Falta un dato obligatorio',
    '23503': 'La operación viola una relación existente',
    '23505': 'El dato ya existe',
    '23514': 'La operación viola una regla de negocio',
    '42501': 'No tienes permiso para realizar esta operación'
  };
  if (error.code === 'P0001') return 'La operación no puede realizarse';
  return messages[error.code] || null;
}

module.exports = { asyncHandler, notFound, errorHandler, getPagination, paginate };

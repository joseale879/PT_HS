class ListAlertHistory {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }

  async execute({ userId, homeId, status, from, to }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    if (status && !['Pending', 'Sent', 'Read', 'Dismissed'].includes(status)) throw this.badRequest('status no es válido');
    if (from && !this.isDate(from)) throw this.badRequest('from no es una fecha válida');
    if (to && !this.isDate(to)) throw this.badRequest('to no es una fecha válida');
    if (from && to && from > to) throw this.badRequest('El rango de fechas no es válido');
    return this.alertRepository.listHistory({ userId, homeId, status, from, to });
  }

  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  isDate(value) { return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}

module.exports = { ListAlertHistory };

class UpdateAlertStatus {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }

  execute({ userId, alertId, status }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(alertId)) throw this.badRequest('alertId no es válido');
    if (!['Read', 'Dismissed'].includes(status)) throw this.badRequest('status debe ser Read o Dismissed');
    return this.alertRepository.updateStatus({ userId, alertId, status });
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}

module.exports = { UpdateAlertStatus };

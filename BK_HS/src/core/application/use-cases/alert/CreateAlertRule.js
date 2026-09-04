const TYPES = ['excessive_consumption', 'leak_detected', 'monthly_limit', 'daily_limit', 'no_reading'];
const UNITS = ['m3_day', 'm3_month', 'lpm'];

class CreateAlertRule {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }

  execute({ userId, homeId, alertType, threshold, unit, active = true }) {
    this.validate(userId, homeId, alertType, threshold, unit, active);
    return this.alertRepository.createRule({ userId, homeId, alertType, threshold: Number(threshold), unit, active });
  }

  validate(userId, homeId, alertType, threshold, unit, active) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    if (!TYPES.includes(alertType)) throw this.badRequest('alertType no es válido');
    if (!Number.isFinite(Number(threshold)) || Number(threshold) < 0) throw this.badRequest('threshold debe ser un número mayor o igual a cero');
    if (!UNITS.includes(unit)) throw this.badRequest('unit no es válida');
    if (typeof active !== 'boolean') throw this.badRequest('active debe ser booleano');
  }

  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}

module.exports = { CreateAlertRule, TYPES, UNITS };

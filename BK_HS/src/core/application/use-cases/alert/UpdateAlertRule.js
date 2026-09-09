const { TYPES, UNITS, TYPE_UNITS } = require('./CreateAlertRule');

class UpdateAlertRule {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }
  execute({ userId, ruleId, alertType, threshold, unit, active }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(ruleId)) throw this.badRequest('ruleId no es válido');
    if (alertType !== undefined && !TYPES.includes(alertType)) throw this.badRequest('alertType no es válido');
    if (threshold !== undefined && (!Number.isFinite(Number(threshold)) || Number(threshold) < 0)) throw this.badRequest('threshold debe ser un número mayor o igual a cero');
    if (unit !== undefined && !UNITS.includes(unit)) throw this.badRequest('unit no es válida');
    if (active !== undefined && typeof active !== 'boolean') throw this.badRequest('active debe ser booleano');
    if (alertType !== undefined && unit !== undefined && TYPE_UNITS[alertType] !== unit) throw this.badRequest('unit no corresponde con alertType');
    if ([alertType, threshold, unit, active].every((value) => value === undefined)) throw this.badRequest('Debe enviar al menos un campo para actualizar');
    return this.alertRepository.updateRule({ userId, ruleId, alertType, threshold: threshold === undefined ? undefined : Number(threshold), unit, active });
  }
  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { UpdateAlertRule };

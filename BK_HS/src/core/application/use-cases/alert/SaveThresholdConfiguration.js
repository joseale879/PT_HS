class SaveThresholdConfiguration {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }
  execute({ userId, homeId, dailyLimit, monthlyLimit, active = true }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    if (dailyLimit === undefined && monthlyLimit === undefined) throw this.badRequest('Debe enviar dailyLimit o monthlyLimit');
    for (const [name, value] of [['dailyLimit', dailyLimit], ['monthlyLimit', monthlyLimit]]) {
      if (value !== undefined && (!Number.isFinite(Number(value)) || Number(value) < 0)) throw this.badRequest(`${name} debe ser un número mayor o igual a cero`);
    }
    if (typeof active !== 'boolean') throw this.badRequest('active debe ser booleano');
    return this.alertRepository.saveThresholdConfiguration({ userId, homeId, dailyLimit: dailyLimit === undefined ? null : Number(dailyLimit), monthlyLimit: monthlyLimit === undefined ? null : Number(monthlyLimit), active });
  }
  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { SaveThresholdConfiguration };

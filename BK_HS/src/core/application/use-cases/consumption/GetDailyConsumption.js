class GetDailyConsumption {
  constructor({ consumptionRepository }) { this.consumptionRepository = consumptionRepository; }

  execute({ userId, homeId, date }) {
    this.validateUser(userId);
    this.validateUuid(homeId, 'homeId');
    this.validateDate(date, 'date');
    if (date > this.today()) this.badRequest('date no puede ser futura');
    return this.consumptionRepository.getDaily({ userId, homeId, date });
  }

  validateUser(value) { if (!value) this.badRequest('El usuario autenticado es obligatorio'); }
  validateUuid(value, field) { if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) this.badRequest(`${field} no es válido`); }
  validateDate(value, field) { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) this.badRequest(`${field} debe tener formato YYYY-MM-DD`); }
  today() { return new Date().toISOString().slice(0, 10); }
  badRequest(message) { const error = new Error(message); error.status = 400; throw error; }
}

module.exports = { GetDailyConsumption };

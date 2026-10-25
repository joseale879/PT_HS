const { assertMaxPeriodDays } = require('../../validation/DateRangeValidation');

class GenerateConsumptionReport {
  constructor({ consumptionRepository }) {
    this.consumptionRepository = consumptionRepository;
  }

  async execute({ userId, homeId, from, to }) {
    this.validateUser(userId);
    this.validateUuid(homeId, 'homeId');
    this.validateDate(from, 'from');
    this.validateDate(to, 'to');
    if (to < from) this.badRequest('to no puede ser anterior a from');
    if (to > this.today()) this.badRequest('El periodo no puede terminar en una fecha futura');
    assertMaxPeriodDays(from, to);

    const summary = await this.consumptionRepository.calculateSummary({ userId, homeId, from, to });
    return { homeId, from, to, summary };
  }

  validateUser(value) {
    if (!value) this.badRequest('El usuario autenticado es obligatorio');
  }

  validateUuid(value, field) {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof value !== 'string' || !pattern.test(value)) this.badRequest(`${field} no es válido`);
  }

  validateDate(value, field) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
      this.badRequest(`${field} debe tener formato YYYY-MM-DD`);
    }
  }

  today() {
    return new Date().toISOString().slice(0, 10);
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

module.exports = { GenerateConsumptionReport };

class GetConsumptionSummary {
  constructor({ consumptionRepository }) {
    this.consumptionRepository = consumptionRepository;
  }

  execute({ userId, homeId, from, to }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    if (!this.isDate(from) || !this.isDate(to)) throw this.badRequest('from y to deben tener formato YYYY-MM-DD');
    if (to < from) throw this.badRequest('to no puede ser anterior a from');
    if (to > this.today()) throw this.badRequest('El periodo no puede terminar en una fecha futura');

    return this.consumptionRepository.calculateSummary({ userId, homeId, from, to });
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  isDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  }

  today() { return new Date().toISOString().slice(0, 10); }

  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}

module.exports = { GetConsumptionSummary };

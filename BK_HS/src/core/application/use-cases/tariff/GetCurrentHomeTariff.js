class GetCurrentHomeTariff {
  constructor({ tariffRepository }) {
    this.tariffRepository = tariffRepository;
  }

  async execute({ userId, homeId, date }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    const effectiveDate = date || new Date().toISOString().slice(0, 10);
    if (!this.isDate(effectiveDate)) throw this.badRequest('date debe tener formato YYYY-MM-DD');

    const tariff = await this.tariffRepository.findCurrentByHome({ userId, homeId, date: effectiveDate });
    if (!tariff) {
      const error = new Error('No existe una tarifa vigente para este hogar en la fecha indicada');
      error.status = 404;
      throw error;
    }
    return tariff;
  }

  isUuid(value) {
    return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  isDate(value) {
    return typeof value === 'string'
      && /^\d{4}-\d{2}-\d{2}$/.test(value)
      && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
}

module.exports = { GetCurrentHomeTariff };

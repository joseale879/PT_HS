class GetMonthlyConsumption {
  constructor({ consumptionRepository }) { this.consumptionRepository = consumptionRepository; }
  execute({ userId, homeId, year, month }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    this.validateUuid(homeId);
    const numericYear = this.integer(year, 'year'); const numericMonth = this.integer(month, 'month');
    if (numericYear < 2000 || numericYear > 2100) this.badRequest('year debe estar entre 2000 y 2100');
    if (numericMonth < 1 || numericMonth > 12) this.badRequest('month debe estar entre 1 y 12');
    const now = new Date();
    if (numericYear > now.getUTCFullYear() || (numericYear === now.getUTCFullYear() && numericMonth > now.getUTCMonth() + 1)) this.badRequest('El periodo no puede ser futuro');
    return this.consumptionRepository.getMonthly({ userId, homeId, year: numericYear, month: numericMonth });
  }
  integer(value, field) { if (!/^\d+$/.test(String(value))) this.badRequest(`${field} debe ser un entero`); return Number(value); }
  validateUuid(value) { if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) this.badRequest('homeId no es válido'); }
  badRequest(message) { const error = new Error(message); error.status = 400; throw error; }
}
module.exports = { GetMonthlyConsumption };

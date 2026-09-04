class GetHourlyConsumption {
  constructor({ consumptionRepository }) { this.consumptionRepository = consumptionRepository; }
  execute({ userId, homeId }) {
    if (!userId) this.badRequest('El usuario autenticado es obligatorio');
    if (typeof homeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(homeId)) this.badRequest('homeId no es válido');
    return this.consumptionRepository.getHourly({ userId, homeId });
  }
  badRequest(message) { const error = new Error(message); error.status = 400; throw error; }
}
module.exports = { GetHourlyConsumption };

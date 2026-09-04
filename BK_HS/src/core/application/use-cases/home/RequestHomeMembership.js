class RequestHomeMembership {
  constructor({ homeRepository }) { this.homeRepository = homeRepository; }
  async execute({ userId, homeId }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    const request = await this.homeRepository.requestMembership({ userId, homeId });
    if (!request) { const error = new Error('Hogar no encontrado'); error.status = 404; throw error; }
    return request;
  }
  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { RequestHomeMembership };

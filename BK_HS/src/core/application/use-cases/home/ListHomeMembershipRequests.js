class ListHomeMembershipRequests {
  constructor({ homeRepository }) { this.homeRepository = homeRepository; }
  async execute({ userId, homeId }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es válido');
    return this.homeRepository.findMembershipRequests({ userId, homeId });
  }
  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { ListHomeMembershipRequests };

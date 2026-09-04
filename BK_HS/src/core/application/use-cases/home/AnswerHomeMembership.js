class AnswerHomeMembership {
  constructor({ homeRepository }) { this.homeRepository = homeRepository; }
  async execute({ userId, requestId, status }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (!this.isUuid(requestId)) throw this.badRequest('requestId no es válido');
    if (!['Approved', 'Rejected'].includes(status)) throw this.badRequest('El estado debe ser Approved o Rejected');
    const request = await this.homeRepository.answerMembershipRequest({ userId, requestId, status });
    if (!request) { const error = new Error('Solicitud pendiente no encontrada'); error.status = 404; throw error; }
    return request;
  }
  isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { AnswerHomeMembership };

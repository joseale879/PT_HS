class DeleteThresholdConfiguration {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }
  execute({ userId, homeId }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (typeof homeId !== 'string' || !/^[0-9a-f-]{36}$/i.test(homeId)) throw this.badRequest('homeId no es válido');
    return this.alertRepository.deleteThresholdConfiguration({ userId, homeId });
  }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { DeleteThresholdConfiguration };

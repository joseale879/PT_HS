class DeleteAlertRule {
  constructor({ alertRepository }) { this.alertRepository = alertRepository; }
  execute({ userId, ruleId }) {
    if (!userId) throw this.badRequest('El usuario autenticado es obligatorio');
    if (typeof ruleId !== 'string' || !/^[0-9a-f-]{36}$/i.test(ruleId)) throw this.badRequest('ruleId no es válido');
    return this.alertRepository.deleteRule({ userId, ruleId });
  }
  badRequest(message) { const error = new Error(message); error.status = 400; return error; }
}
module.exports = { DeleteAlertRule };

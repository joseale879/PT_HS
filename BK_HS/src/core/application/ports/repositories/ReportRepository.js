class ReportRepository {
  async createGenerating() { throw new Error('ReportRepository.createGenerating no implementado'); }
  async markReady() { throw new Error('ReportRepository.markReady no implementado'); }
  async markError() { throw new Error('ReportRepository.markError no implementado'); }
  async listForUser() { throw new Error('ReportRepository.listForUser no implementado'); }
  async findForUser() { throw new Error('ReportRepository.findForUser no implementado'); }
}

module.exports = { ReportRepository };

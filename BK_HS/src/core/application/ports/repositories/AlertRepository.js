class AlertRepository {
  async findPendingByHome() {
    throw new Error('AlertRepository.findPendingByHome no implementado');
  }

  async updateStatus() {
    throw new Error('AlertRepository.updateStatus no implementado');
  }

  async createRule() { throw new Error('AlertRepository.createRule no implementado'); }
  async listRules() { throw new Error('AlertRepository.listRules no implementado'); }
  async updateRule() { throw new Error('AlertRepository.updateRule no implementado'); }
  async deleteRule() { throw new Error('AlertRepository.deleteRule no implementado'); }
  async findThresholdConfiguration() { throw new Error('AlertRepository.findThresholdConfiguration no implementado'); }
  async saveThresholdConfiguration() { throw new Error('AlertRepository.saveThresholdConfiguration no implementado'); }
  async deleteThresholdConfiguration() { throw new Error('AlertRepository.deleteThresholdConfiguration no implementado'); }
}

module.exports = { AlertRepository };

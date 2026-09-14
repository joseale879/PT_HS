class PrivacyRepository {
  async exportUserData() { throw new Error('PrivacyRepository.exportUserData no implementado'); }
  async listConsents() { throw new Error('PrivacyRepository.listConsents no implementado'); }
  async createConsent() { throw new Error('PrivacyRepository.createConsent no implementado'); }
  async createArcoRequest() { throw new Error('PrivacyRepository.createArcoRequest no implementado'); }
  async listArcoRequests() { throw new Error('PrivacyRepository.listArcoRequests no implementado'); }
  async getArcoRequest() { throw new Error('PrivacyRepository.getArcoRequest no implementado'); }
  async updateArcoRequest() { throw new Error('PrivacyRepository.updateArcoRequest no implementado'); }
}

module.exports = { PrivacyRepository };

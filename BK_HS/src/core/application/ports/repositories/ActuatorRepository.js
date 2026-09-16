class ActuatorRepository {
  async createPending() {
    throw new Error('ActuatorRepository.createPending no implementado');
  }

  async markPublished() {
    throw new Error('ActuatorRepository.markPublished no implementado');
  }

  async markFailed() {
    throw new Error('ActuatorRepository.markFailed no implementado');
  }

  async expirePendingCommands() {
    throw new Error('ActuatorRepository.expirePendingCommands no implementado');
  }

  async listStates() {
    throw new Error('ActuatorRepository.listStates no implementado');
  }

  async listCommands() {
    throw new Error('ActuatorRepository.listCommands no implementado');
  }

  async getStatesByDevice() {
    throw new Error('ActuatorRepository.getStatesByDevice no implementado');
  }
}

module.exports = { ActuatorRepository };

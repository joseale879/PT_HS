class UserRepository {
  async findById() { throw new Error('UserRepository.findById no implementado'); }
  async updateProfile() { throw new Error('UserRepository.updateProfile no implementado'); }
  async getPreferences() { throw new Error('UserRepository.getPreferences no implementado'); }
  async updatePreferences() { throw new Error('UserRepository.updatePreferences no implementado'); }
  async changeAccountStatus() { throw new Error('UserRepository.changeAccountStatus no implementado'); }
  async deleteAccount() { throw new Error('UserRepository.deleteAccount no implementado'); }
  async listManagedUsers() { throw new Error('UserRepository.listManagedUsers no implementado'); }
}
module.exports = { UserRepository };

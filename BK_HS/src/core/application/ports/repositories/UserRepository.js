class UserRepository {
  async findById() { throw new Error('UserRepository.findById no implementado'); }
  async updateProfile() { throw new Error('UserRepository.updateProfile no implementado'); }
  async getPreferences() { throw new Error('UserRepository.getPreferences no implementado'); }
  async updatePreferences() { throw new Error('UserRepository.updatePreferences no implementado'); }
}
module.exports = { UserRepository };

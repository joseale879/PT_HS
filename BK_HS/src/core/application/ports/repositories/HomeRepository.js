class HomeRepository {
  async createWithOwner() { throw new Error('HomeRepository.createWithOwner no implementado'); }

  async findByUserId() { throw new Error('HomeRepository.findByUserId no implementado'); }

  async findByIdForUser() { throw new Error('HomeRepository.findByIdForUser no implementado'); }

  async updateForUser() { throw new Error('HomeRepository.updateForUser no implementado'); }

  async findMembersForUser() { throw new Error('HomeRepository.findMembersForUser no implementado'); }

  async addMemberForOwner() { throw new Error('HomeRepository.addMemberForOwner no implementado'); }

  async changeMemberRole() { throw new Error('HomeRepository.changeMemberRole no implementado'); }
  async removeMember() { throw new Error('HomeRepository.removeMember no implementado'); }
  async requestMembership() { throw new Error('HomeRepository.requestMembership no implementado'); }
  async answerMembershipRequest() { throw new Error('HomeRepository.answerMembershipRequest no implementado'); }
  async findMembershipRequests() { throw new Error('HomeRepository.findMembershipRequests no implementado'); }
}

module.exports = { HomeRepository };

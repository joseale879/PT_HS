class RecommendationRepository {
  async listUserRecommendations() {
    throw new Error('RecommendationRepository.listUserRecommendations no implementado');
  }

  async updateUserRecommendation() {
    throw new Error('RecommendationRepository.updateUserRecommendation no implementado');
  }

  async getHomeSummary() {
    throw new Error('RecommendationRepository.getHomeSummary no implementado');
  }
}

module.exports = { RecommendationRepository };

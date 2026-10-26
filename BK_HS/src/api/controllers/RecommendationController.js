const { paginate } = require('../../shared/http');

class RecommendationController {
  constructor({ listRecommendations, updateRecommendation, getRecommendationSummary }) {
    this.listRecommendations = listRecommendations;
    this.updateRecommendation = updateRecommendation;
    this.getRecommendationSummary = getRecommendationSummary;
  }

  async list(req, res) {
    const recommendations = await this.listRecommendations.execute({
      userId: req.user.id,
      homeId: req.query.homeId,
      status: req.query.status
    });
    const result = paginate(recommendations, req.query, {
      sortFields: ['title', 'category', 'status', 'sentAt'],
      filter: (recommendation) => !req.query.category || recommendation.category === req.query.category
    });
    res.json({ data: result.items, pagination: result.pagination });
  }

  async update(req, res) {
    const { status, usefulness } = req.body || {};
    res.json({
      data: await this.updateRecommendation.execute({
        userId: req.user.id,
        userRecommendationId: req.params.userRecommendationId,
        status,
        usefulness
      })
    });
  }

  async summary(req, res) {
    res.json({
      data: await this.getRecommendationSummary.execute({
        userId: req.user.id,
        homeId: req.params.homeId
      })
    });
  }
}

module.exports = { RecommendationController };

const RECOMMENDATION_STATUSES = ['Pending', 'Read', 'Dismissed', 'Applied'];
const UPDATE_STATUSES = ['Read', 'Dismissed', 'Applied'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class RecommendationUseCase {
  constructor({ repository }) {
    if (!repository) throw new Error('repository es obligatorio');
    this.repository = repository;
  }

  isUuid(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value);
  }

  badRequest(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
  }

  requireUser(userId) {
    if (!this.isUuid(userId)) throw this.badRequest('El usuario autenticado no es valido');
  }
}

class ListRecommendations extends RecommendationUseCase {
  async execute({ userId, homeId, status }) {
    this.requireUser(userId);
    if (homeId !== undefined && homeId !== '' && !this.isUuid(homeId)) {
      throw this.badRequest('homeId no es valido');
    }
    if (status !== undefined && status !== '' && !RECOMMENDATION_STATUSES.includes(status)) {
      throw this.badRequest('status no es valido');
    }

    return this.repository.listUserRecommendations({
      userId,
      homeId: homeId || undefined,
      status: status || undefined
    });
  }
}

class UpdateRecommendation extends RecommendationUseCase {
  async execute({ userId, userRecommendationId, status, usefulness }) {
    this.requireUser(userId);
    if (!this.isUuid(userRecommendationId)) {
      throw this.badRequest('userRecommendationId no es valido');
    }
    if (status === undefined && usefulness === undefined) {
      throw this.badRequest('Debes enviar status o usefulness');
    }
    if (status !== undefined && !UPDATE_STATUSES.includes(status)) {
      throw this.badRequest('status no es valido para actualizar');
    }
    if (usefulness !== undefined && usefulness !== null && typeof usefulness !== 'boolean') {
      throw this.badRequest('usefulness debe ser booleano o null');
    }

    return this.repository.updateUserRecommendation({
      userId,
      userRecommendationId,
      status,
      usefulness
    });
  }
}

class GetRecommendationSummary extends RecommendationUseCase {
  async execute({ userId, homeId }) {
    this.requireUser(userId);
    if (!this.isUuid(homeId)) throw this.badRequest('homeId no es valido');
    return this.repository.getHomeSummary({ userId, homeId });
  }
}

module.exports = {
  RECOMMENDATION_STATUSES,
  UPDATE_STATUSES,
  ListRecommendations,
  UpdateRecommendation,
  GetRecommendationSummary
};

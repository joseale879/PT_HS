const { withTransaction } = require('../../../../infrastructure/db');
const { RecommendationRepository } = require('../../../application/ports/repositories/RecommendationRepository');

const recommendationSelect = `
  SELECT ur.user_recommendation_id, ur.recommendation_id, ur.user_account_id, ur.home_id,
         ur.status, ur.usefulness, ur.sent_at, ur.read_at,
         r.title, r.description, r.activation_threshold, r.threshold_unit,
         c.name AS category
    FROM analytics_support.user_recommendation ur
    JOIN analytics_support.recommendation r ON r.recommendation_id = ur.recommendation_id
    JOIN analytics_support.recommendation_category c ON c.category_id = r.category_id`;

class PostgresRecommendationRepository extends RecommendationRepository {
  map(row) {
    return {
      userRecommendationId: row.user_recommendation_id,
      recommendationId: row.recommendation_id,
      userId: row.user_account_id,
      homeId: row.home_id,
      title: row.title,
      description: row.description,
      category: row.category,
      activationThreshold:
        row.activation_threshold == null ? null : Number(row.activation_threshold),
      thresholdUnit: row.threshold_unit,
      status: row.status,
      usefulness: row.usefulness,
      sentAt: row.sent_at,
      readAt: row.read_at
    };
  }

  async listUserRecommendations({ userId, homeId, status }) {
    const values = [];
    const conditions = [];
    if (homeId) {
      values.push(homeId);
      conditions.push(`ur.home_id = $${values.length}::uuid`);
    }
    if (status) {
      values.push(status);
      conditions.push(`ur.status = $${values.length}::varchar`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await withTransaction(userId, (client) => client.query(
      `${recommendationSelect} ${where} ORDER BY ur.sent_at DESC`,
      values
    ));
    return result.rows.map((row) => this.map(row));
  }

  async updateUserRecommendation({ userId, userRecommendationId, status, usefulness }) {
    const values = [userRecommendationId];
    const changes = [];

    if (status !== undefined) {
      values.push(status);
      const statusParameter = `$${values.length}::varchar`;
      changes.push(`status = ${statusParameter}`);
      changes.push(`read_at = CASE WHEN ${statusParameter} = 'Read' THEN COALESCE(read_at, now()) ELSE read_at END`);
    }
    if (usefulness !== undefined) {
      values.push(usefulness);
      changes.push(`usefulness = $${values.length}::boolean`);
    }

    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE analytics_support.user_recommendation
          SET ${changes.join(', ')}
        WHERE user_recommendation_id = $1::uuid
        RETURNING user_recommendation_id`,
      values
    ));
    if (!result.rowCount) {
      const error = new Error('Recomendacion no encontrada');
      error.status = 404;
      throw error;
    }

    return this.getUserRecommendation({ userId, userRecommendationId });
  }

  async getUserRecommendation({ userId, userRecommendationId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `${recommendationSelect} WHERE ur.user_recommendation_id = $1::uuid LIMIT 1`,
      [userRecommendationId]
    ));
    if (!result.rowCount) {
      const error = new Error('Recomendacion no encontrada');
      error.status = 404;
      throw error;
    }
    return this.map(result.rows[0]);
  }

  async getHomeSummary({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      'SELECT * FROM analytics_support.fn_get_home_recommendation_summary($1::uuid)',
      [homeId]
    ));
    const row = result.rows[0];
    return {
      homeId,
      totalRecommendations: Number(row?.total_recommendations || 0),
      appliedCount: Number(row?.applied_count || 0),
      pendingCount: Number(row?.pending_count || 0),
      dismissedCount: Number(row?.dismissed_count || 0),
      averageUsefulness: row?.avg_usefulness == null ? null : Number(row.avg_usefulness),
      refreshedAt: row?.refreshed_at || null
    };
  }
}

module.exports = { PostgresRecommendationRepository };

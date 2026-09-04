const { ConsumptionSummary } = require('../../../domain/entities/ConsumptionSummary');
const { withTransaction } = require('../../../../infrastructure/db');

class PostgresConsumptionRepository {
  async calculateSummary({ userId, homeId, from, to }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT * FROM consumption.fn_calculate_consumption($1::uuid, $2::date, $3::date)`,
      [homeId, from, to]
    ));
    const row = result.rows[0] || {};
    return new ConsumptionSummary({
      homeId,
      from,
      to,
      totalM3: row.total_m3,
      totalLiters: row.total_liters,
      totalCost: row.total_cost,
      readingCount: row.reading_count
    });
  }

  async getDaily({ userId, homeId, date }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_get_daily_consumption($1::uuid, $2::date) AS consumption_liters`, [homeId, date]
    ));
    return { homeId, date, consumptionLiters: Number(result.rows[0]?.consumption_liters || 0) };
  }

  async getMonthly({ userId, homeId, year, month }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_get_monthly_consumption($1::uuid, $2::integer, $3::integer) AS consumption_liters`, [homeId, year, month]
    ));
    return { homeId, year, month, consumptionLiters: Number(result.rows[0]?.consumption_liters || 0) };
  }

  async getHourly({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT home_id, hour, avg_consumption_m3, avg_consumption_liters, sample_count, refreshed_at
         FROM consumption.fn_get_home_hourly_consumption($1::uuid)`, [homeId]
    ));
    return result.rows.map((row) => ({
      homeId: row.home_id,
      hour: Number(row.hour),
      averageConsumptionM3: Number(row.avg_consumption_m3 || 0),
      averageConsumptionLiters: Number(row.avg_consumption_liters || 0),
      sampleCount: Number(row.sample_count || 0),
      refreshedAt: row.refreshed_at
    }));
  }

  async calculatePeriodCost({ userId, homeId, from, to }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_calculate_period_cost($1::uuid, $2::date, $3::date) AS total_cost`,
      [homeId, from, to]
    ));
    const value = result.rows[0]?.total_cost;
    return { homeId, from, to, totalCost: value === null ? null : Number(value) };
  }
}

module.exports = { PostgresConsumptionRepository };

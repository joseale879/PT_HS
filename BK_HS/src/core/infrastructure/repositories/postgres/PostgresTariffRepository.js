const { withTransaction } = require('../../../../infrastructure/db');

class PostgresTariffRepository {
  async findCurrentByHome({ userId, homeId, date }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT rate_id, home_id, tier, m3_value, fixed_charge, valid_from, valid_until
         FROM alert_rate.home_rate
        WHERE home_id = $1::uuid
          AND valid_from <= $2::date
          AND (valid_until IS NULL OR valid_until >= $2::date)
        ORDER BY valid_from DESC
        LIMIT 1`,
      [homeId, date]
    ));
    const row = result.rows[0];
    if (!row) return null;
    return {
      rateId: row.rate_id,
      homeId: row.home_id,
      tier: Number(row.tier),
      m3Value: Number(row.m3_value),
      fixedCharge: Number(row.fixed_charge),
      validFrom: row.valid_from,
      validUntil: row.valid_until
    };
  }
}

module.exports = { PostgresTariffRepository };

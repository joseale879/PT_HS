const { User } = require('../../../domain/entities/User');
const { withTransaction } = require('../../../../infrastructure/db');
const { UserRepository } = require('../../../application/ports/repositories/UserRepository');
class PostgresUserRepository extends UserRepository {
  async findById(userId) {
    const result = await withTransaction(userId, (client) => client.query(`SELECT ua.user_account_id, ua.username, ua.email, ua.status, ua.created_at, up.full_name, up.document_type, up.document_number, up.phone, up.city FROM user_account.user_account ua LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id WHERE ua.user_account_id = $1::uuid AND ua.deleted_at IS NULL`, [userId]));
    return result.rows[0] ? this.toEntity(result.rows[0]) : null;
  }
  async updateProfile({ userId, fullName, phone, city }) {
    const result = await withTransaction(userId, async (client) => {
      await client.query(`INSERT INTO user_account.user_profile (user_account_id, full_name, phone, city) VALUES ($1::uuid, $2::varchar, $3::varchar, $4::varchar) ON CONFLICT (user_account_id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, city = EXCLUDED.city`, [userId, fullName, phone, city]);
      return client.query(`SELECT ua.user_account_id, ua.username, ua.email, ua.status, ua.created_at, up.full_name, up.document_type, up.document_number, up.phone, up.city FROM user_account.user_account ua JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id WHERE ua.user_account_id = $1::uuid AND ua.deleted_at IS NULL`, [userId]);
    });
    return result.rows[0] ? this.toEntity(result.rows[0]) : null;
  }
  async getPreferences(userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT COALESCE(language.code, 'es') AS language, COALESCE(currency.code, 'COP') AS currency
         FROM (SELECT $1::uuid AS user_account_id) requested
         LEFT JOIN preference.user_preference user_preference ON user_preference.user_account_id = requested.user_account_id
         LEFT JOIN preference.language language ON language.language_id = user_preference.language_id
         LEFT JOIN preference.currency currency ON currency.currency_id = user_preference.currency_id`,
      [userId]
    ));
    return result.rows[0];
  }
  async updatePreferences({ userId, language, currency }) {
    const result = await withTransaction(userId, (client) => client.query(
      `WITH selected_language AS (
          SELECT language_id FROM preference.language WHERE code = $2::varchar AND active = TRUE
       ), selected_currency AS (
          SELECT currency_id FROM preference.currency WHERE code = $3::varchar AND active = TRUE
       ), saved AS (
          INSERT INTO preference.user_preference (user_account_id, language_id, currency_id)
          SELECT $1::uuid, selected_language.language_id, selected_currency.currency_id
            FROM selected_language CROSS JOIN selected_currency
          ON CONFLICT (user_account_id) DO UPDATE
             SET language_id = EXCLUDED.language_id,
                 currency_id = EXCLUDED.currency_id,
                 updated_at = now()
          RETURNING language_id, currency_id
       )
       SELECT language.code AS language, currency.code AS currency
         FROM saved
         JOIN preference.language language ON language.language_id = saved.language_id
         JOIN preference.currency currency ON currency.currency_id = saved.currency_id`,
      [userId, language, currency]
    ));
    return result.rows[0] || null;
  }
  toEntity(row) { return new User({ id: row.user_account_id, username: row.username, email: row.email, status: row.status, fullName: row.full_name, documentType: row.document_type, documentNumber: row.document_number, phone: row.phone, city: row.city, createdAt: row.created_at }); }
}
module.exports = { PostgresUserRepository };

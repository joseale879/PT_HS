const { pool, withTransaction } = require('../../../../infrastructure/db');
const { AuthRepository } = require('../../../application/ports/repositories/AuthRepository');

class PostgresAuthRepository extends AuthRepository {
  async register({ username, email, fullName, documentType, documentNumber, passwordHash }) {
    return withTransaction(null, async (client) => {
      const created = await client.query('SELECT user_account.fn_register_user($1::varchar, $2::varchar) AS user_id', [username, email]);
      const userId = created.rows[0].user_id;
      await client.query("SELECT set_config('app.user_id', $1, true)", [userId]);
      await client.query('SELECT user_account.fn_set_password_hash($1::uuid, $2::text, NULL, FALSE)', [userId, passwordHash]);
      await client.query(`INSERT INTO user_account.user_profile (user_account_id, full_name, document_type, document_number) VALUES ($1::uuid, $2::varchar, $3::varchar, $4::varchar)`, [userId, fullName, documentType, documentNumber]);
      return userId;
    });
  }

  async findCredentials(login) {
    const result = await pool.query('SELECT * FROM user_account.fn_get_credential_for_login($1::varchar)', [login]);
    return result.rows[0] || null;
  }

  async recordLoginFailure(userId, sourceIp) {
    await pool.query('SELECT user_account.fn_record_login_failure($1::uuid, $2::varchar)', [userId, sourceIp]);
  }

  async getLoginSecurityState(userId) {
    const result = await pool.query(
      `SELECT blocked_until, requires_change, password_changed_at, expiration_days
         FROM user_account.fn_get_login_security_state($1::uuid)`, [userId]
    );
    const row = result.rows[0];
    return row ? {
      blockedUntil: row.blocked_until,
      requiresChange: row.requires_change,
      passwordChangedAt: row.password_changed_at,
      expirationDays: row.expiration_days
    } : null;
  }

  async getActivePasswordPolicy() {
    const result = await pool.query(
      `SELECT min_length, requires_uppercase, requires_lowercase, requires_number, requires_symbol
         FROM user_account.fn_get_active_password_policy()`
    );
    return result.rows[0] || null;
  }

  async resetLoginAttempts(userId) {
    await pool.query('SELECT user_account.fn_reset_login_attempts($1::uuid)', [userId]);
  }

  async createSession({ userId, refreshTokenHash, refreshExpiresAt, sourceIp, userAgent }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT session_id, refresh_token_id, refresh_expires_at
         FROM user_account.fn_create_session($1::uuid, $2::text, $3::timestamptz, $4::varchar, $5::text)`,
      [userId, refreshTokenHash, refreshExpiresAt, sourceIp, userAgent]
    ));
    return {
      sessionId: result.rows[0].session_id,
      refreshTokenId: result.rows[0].refresh_token_id,
      refreshExpiresAt: result.rows[0].refresh_expires_at
    };
  }

  async rotateRefreshToken({ refreshTokenHash, newRefreshTokenHash, refreshExpiresAt, sourceIp, userAgent }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT user_id, session_id, refresh_expires_at
         FROM user_account.fn_rotate_refresh_token($1::text, $2::text, $3::timestamptz, $4::varchar, $5::text)`,
      [refreshTokenHash, newRefreshTokenHash, refreshExpiresAt, sourceIp, userAgent]
    ));
    return {
      userId: result.rows[0].user_id,
      sessionId: result.rows[0].session_id,
      refreshExpiresAt: result.rows[0].refresh_expires_at
    };
  }

  async revokeRefreshSession({ refreshTokenHash, userId, sessionId }) {
    const result = await withTransaction(userId, async (client) => {
      const owned = await client.query(
        `SELECT 1 FROM user_account.token t
           JOIN user_account.session s ON s.token_id = t.token_id
          WHERE t.token_hash = $1::text AND t.type = 'refresh'
            AND t.status = 'Active' AND s.status = 'Active'
            AND s.session_id = $2::uuid AND s.user_account_id = $3::uuid
          LIMIT 1`, [refreshTokenHash, sessionId, userId]
      );
      if (!owned.rowCount) return false;
      const revoked = await client.query(
        `SELECT user_account.fn_revoke_refresh_session($1::text) AS revoked`, [refreshTokenHash]
      );
      return revoked.rows[0]?.revoked === true;
    });
    return result;
  }

  async findCredentialsForUser(userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT user_account_id, password_hash, account_status
         FROM user_account.fn_get_credential_for_user($1::uuid)`, [userId]
    ));
    const row = result.rows[0];
    return row ? { userId: row.user_account_id, passwordHash: row.password_hash, accountStatus: row.account_status } : null;
  }

  async changePasswordHash({ userId, passwordHash }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT user_account.fn_change_password_hash($1::uuid, $2::text) AS changed`, [userId, passwordHash]
    ));
    return result.rows[0]?.changed === true;
  }

  async createPasswordResetToken({ login, tokenHash, expiresAt }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT user_account.fn_create_password_reset_token($1::varchar, $2::text, $3::timestamptz) AS reset_id`,
      [login, tokenHash, expiresAt]
    ));
    return result.rows[0]?.reset_id || null;
  }

  async createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
    await pool.query('SELECT user_account.fn_create_email_verification_token($1::uuid, $2::text, $3::timestamptz)', [userId, tokenHash, expiresAt]);
  }

  async verifyEmail({ tokenHash }) {
    const result = await pool.query('SELECT user_account.fn_verify_email($1::text) AS user_id', [tokenHash]);
    return result.rows[0]?.user_id || null;
  }

  async consumePasswordReset({ tokenHash, passwordHash }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT user_account.fn_consume_password_reset($1::text, $2::text) AS user_id`, [tokenHash, passwordHash]
    ));
    return result.rows[0]?.user_id || null;
  }

  async findPasswordResetEmail({ tokenHash }) {
    const result = await pool.query(
      'SELECT user_account.fn_get_password_reset_email($1::text) AS email',
      [tokenHash]
    );
    return result.rows[0]?.email || null;
  }
}

module.exports = { PostgresAuthRepository };

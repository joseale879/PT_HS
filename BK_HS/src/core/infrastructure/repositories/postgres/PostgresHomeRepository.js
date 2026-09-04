const { Home } = require('../../../domain/entities/Home');
const { withTransaction } = require('../../../../infrastructure/db');
const { HomeRepository } = require('../../../application/ports/repositories/HomeRepository');

class PostgresHomeRepository extends HomeRepository {
  async createWithOwner(home, userId) {
    const homeId = await withTransaction(userId, async (client) => {
      const result = await client.query(
        `SELECT home.fn_create_home_with_owner($1::varchar, $2::varchar, $3::varchar, $4::smallint, $5::uuid) AS home_id`,
        [home.name, home.address, home.city, home.tier, userId]
      );
      return result.rows[0].home_id;
    });

    return new Home({ ...home, id: homeId, status: 'Active' });
  }

  async findByUserId(userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT h.home_id, h.name, h.address, h.city, h.tier, h.status, h.created_at
         FROM home.home h
         JOIN home.home_user hu ON hu.home_id = h.home_id
        WHERE hu.user_account_id = $1::uuid
        ORDER BY h.created_at DESC`,
      [userId]
    ));

    return result.rows.map((row) => new Home({
      id: row.home_id,
      name: row.name,
      address: row.address,
      city: row.city,
      tier: row.tier,
      status: row.status,
      createdAt: row.created_at
    }));
  }

  async findByIdForUser(homeId, userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT h.home_id, h.name, h.address, h.city, h.tier, h.status, h.created_at
         FROM home.home h
         JOIN home.home_user hu ON hu.home_id = h.home_id
        WHERE h.home_id = $1::uuid
          AND hu.user_account_id = $2::uuid
        LIMIT 1`,
      [homeId, userId]
    ));

    const row = result.rows[0];
    return row ? new Home({
      id: row.home_id,
      name: row.name,
      address: row.address,
      city: row.city,
      tier: row.tier,
      status: row.status,
      createdAt: row.created_at
    }) : null;
  }

  async updateForUser(home, userId) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE home.home
          SET name = $2::varchar,
              address = $3::varchar,
              city = $4::varchar,
              tier = $5::smallint,
              updated_at = now()
        WHERE home_id = $1::uuid
        RETURNING home_id, name, address, city, tier, status, created_at`,
      [home.id, home.name, home.address, home.city, home.tier]
    ));

    const row = result.rows[0];
    return row ? new Home({
      id: row.home_id,
      name: row.name,
      address: row.address,
      city: row.city,
      tier: row.tier,
      status: row.status,
      createdAt: row.created_at
    }) : null;
  }

  async findMembersForUser(homeId, userId) {
    const result = await withTransaction(userId, async (client) => {
      const access = await client.query(
        `SELECT 1
           FROM home.home_user
          WHERE home_id = $1::uuid
            AND user_account_id = $2::uuid
          LIMIT 1`,
        [homeId, userId]
      );
      if (!access.rowCount) return null;

      return client.query(
        `SELECT ua.user_account_id AS user_id,
                ua.username,
                ua.email,
                up.full_name,
                hu.home_role,
                hu.assigned_at
           FROM home.home_user hu
           JOIN user_account.user_account ua ON ua.user_account_id = hu.user_account_id
           LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id
          WHERE hu.home_id = $1::uuid
            AND ua.deleted_at IS NULL
          ORDER BY CASE hu.home_role WHEN 'Owner' THEN 1 WHEN 'Member' THEN 2 ELSE 3 END,
                   hu.assigned_at`,
        [homeId]
      );
    });

    return result === null ? null : result.rows;
  }

  async addMemberForOwner({ homeId, email, homeRole, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT user_id, username, email, full_name, home_role, assigned_at
         FROM home.fn_add_home_member($1::uuid, $2::varchar, $3::varchar)`,
      [homeId, email, homeRole]
    ));
    return result.rows[0] || null;
  }

  async changeMemberRole({ homeId, memberUserId, homeRole, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT user_id, username, email, full_name, home_role, assigned_at
         FROM home.fn_change_home_member_role($1::uuid, $2::uuid, $3::varchar)`,
      [homeId, memberUserId, homeRole]
    ));
    return result.rows[0] || null;
  }

  async removeMember({ homeId, memberUserId, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT home.fn_remove_home_member($1::uuid, $2::uuid) AS removed`,
      [homeId, memberUserId]
    ));
    return result.rows[0]?.removed === true;
  }

  async requestMembership({ homeId, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT request_id, home_id, user_id, status, requested_at
         FROM home.fn_request_home_membership($1::uuid)`, [homeId]
    ));
    return result.rows[0] || null;
  }

  async answerMembershipRequest({ requestId, status, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT request_id, home_id, user_id, status, requested_at, answered_at
         FROM home.fn_answer_home_membership_request($1::uuid, $2::varchar)`, [requestId, status]
    ));
    return result.rows[0] || null;
  }

  async findMembershipRequests({ homeId, userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT request_id, home_id, user_account_id AS user_id, status, requested_at, answered_at
         FROM home.home_member_request
        WHERE home_id = $1::uuid
        ORDER BY requested_at DESC`, [homeId]
    ));
    return result.rows;
  }
}

module.exports = { PostgresHomeRepository };

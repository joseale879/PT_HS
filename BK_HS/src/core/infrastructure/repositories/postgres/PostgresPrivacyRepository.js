const { withTransaction } = require('../../../../infrastructure/db');
const { PrivacyRepository } = require('../../../application/ports/repositories/PrivacyRepository');

function mapConsent(row) {
  return { consentId: row.consent_id, userId: row.user_account_id, type: row.type, documentVersion: row.document_version, accepted: row.accepted, date: row.date, sourceIp: row.source_ip, userAgent: row.user_agent };
}

function mapRequest(row) {
  return { requestId: row.request_id, userId: row.user_account_id, type: row.type, description: row.description, status: row.status, requestedAt: row.requested_at, deadlineAt: row.deadline_at, answeredAt: row.answered_at, answer: row.answer, answeredBy: row.answered_by, attachmentDocument: row.attachment_document, createdAt: row.created_at, updatedAt: row.updated_at };
}

class PostgresPrivacyRepository extends PrivacyRepository {
  async exportUserData({ userId }) {
    const result = await withTransaction(userId, async (client) => {
      const account = await client.query(
        `SELECT ua.user_account_id, ua.username, ua.email, ua.status, ua.created_at, ua.updated_at,
                up.full_name, up.document_type, up.document_number, up.phone, up.city
           FROM user_account.user_account ua
           LEFT JOIN user_account.user_profile up ON up.user_account_id = ua.user_account_id
          WHERE ua.user_account_id = $1::uuid AND ua.deleted_at IS NULL`, [userId]
      );
      const preferences = await client.query(
        `SELECT COALESCE(language.code, 'es') AS language, COALESCE(currency.code, 'COP') AS currency
           FROM (SELECT $1::uuid AS user_account_id) requested
           LEFT JOIN preference.user_preference preference ON preference.user_account_id = requested.user_account_id
           LEFT JOIN preference.language language ON language.language_id = preference.language_id
           LEFT JOIN preference.currency currency ON currency.currency_id = preference.currency_id`, [userId]
      );
      const roles = await client.query(
        `SELECT DISTINCT role_name AS name
           FROM user_account.fn_get_my_authorization_context()
          WHERE role_name IS NOT NULL ORDER BY role_name`
      );
      const homes = await client.query(
        `SELECT h.home_id, h.name, h.address, h.city, h.tier, h.status, h.created_at, h.updated_at,
                hu.home_role, hu.assigned_at
           FROM home.home_user hu
           JOIN home.home h ON h.home_id = hu.home_id
          WHERE hu.user_account_id = $1::uuid AND h.deleted_at IS NULL
          ORDER BY h.name`, [userId]
      );
      const devices = await client.query(
        `SELECT d.device_id, d.code, d.name, d.type, d.manufacturer, d.model, d.firmware_version,
                d.status, d.last_connection_at, d.signal_quality, d.battery_level, d.voltage,
                d.temperature, hd.home_id, hd.status AS home_device_status, hd.installed_at
           FROM home.home_device hd
           JOIN device.device d ON d.device_id = hd.device_id
          ORDER BY d.name`
      );
      const dailyConsumption = await client.query(
        `SELECT summary_id, home_id, date, total_consumption_m3, total_consumption_liters,
                reading_count, total_cost, generated_at
           FROM consumption.daily_consumption_summary
          ORDER BY date DESC, home_id`
      );
      const consents = await client.query(
        `SELECT consent_id, type, document_version, accepted, date, source_ip, user_agent
           FROM privacy.user_consent ORDER BY date DESC`
      );
      const arcoRequests = await client.query(
        `SELECT request_id, type, description, status, requested_at, deadline_at, answered_at,
                answer, answered_by, attachment_document, created_at, updated_at
           FROM privacy.arco_request ORDER BY requested_at DESC`
      );
      const tickets = await client.query(
        `SELECT t.ticket_id, t.title, t.description, c.name AS category, p.name AS priority,
                s.name AS status, t.assigned_to, t.created_at, t.updated_at, t.resolved_at,
                t.closed_at, t.attachment_url
           FROM analytics_support.ticket t
           JOIN analytics_support.ticket_category c ON c.category_id = t.category_id
           JOIN analytics_support.ticket_priority p ON p.priority_id = t.priority_id
           JOIN analytics_support.ticket_status s ON s.status_id = t.status_id
          ORDER BY t.created_at DESC`
      );

      const ticketIds = tickets.rows.map((row) => row.ticket_id);
      const responses = ticketIds.length
        ? await client.query(
          `SELECT response_id, ticket_id, user_account_id, message, created_at
             FROM analytics_support.ticket_response
            WHERE ticket_id = ANY($1::uuid[]) ORDER BY created_at ASC`, [ticketIds]
        )
        : { rows: [] };

      return { account: account.rows[0] || null, preferences: preferences.rows[0] || null, roles: roles.rows, homes: homes.rows, devices: devices.rows, dailyConsumption: dailyConsumption.rows, consents: consents.rows, arcoRequests: arcoRequests.rows, tickets: tickets.rows, ticketResponses: responses.rows };
    });

    if (!result.account) { const error = new Error('Usuario no encontrado'); error.status = 404; throw error; }
    return { exportedAt: new Date().toISOString(), data: result };
  }

  async listConsents({ userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consent_id, user_account_id, type, document_version, accepted, date, source_ip, user_agent
         FROM privacy.user_consent ORDER BY date DESC`,
    ));
    return result.rows.map(mapConsent);
  }

  async createConsent({ userId, type, documentVersion, accepted, sourceIp, userAgent }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO privacy.user_consent (user_account_id, type, document_version, accepted, source_ip, user_agent)
       VALUES ($1::uuid, $2::varchar, $3::varchar, $4::boolean, $5::varchar, $6::text)
       RETURNING consent_id, user_account_id, type, document_version, accepted, date, source_ip, user_agent`,
      [userId, type, documentVersion, accepted, sourceIp || null, userAgent || null]
    ));
    return mapConsent(result.rows[0]);
  }

  async createArcoRequest({ userId, type, description }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO privacy.arco_request (user_account_id, type, description, deadline_at)
       VALUES ($1::uuid, $2::varchar, $3::text, now() + interval '15 days')
       RETURNING request_id, user_account_id, type, description, status, requested_at, deadline_at,
                 answered_at, answer, answered_by, attachment_document, created_at, updated_at`,
      [userId, type, description]
    ));
    return mapRequest(result.rows[0]);
  }

  async listArcoRequests({ userId, status, type, managed, limit, offset }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT request_id, user_account_id, type, description, status, requested_at, deadline_at,
              answered_at, answer, answered_by, attachment_document, created_at, updated_at,
              count(*) OVER() AS total_count
         FROM privacy.arco_request
        WHERE ($1::boolean OR user_account_id = user_account.fn_app_current_user_id())
          AND ($2::varchar IS NULL OR status = $2::varchar)
          AND ($3::varchar IS NULL OR type = $3::varchar)
        ORDER BY requested_at DESC
        LIMIT $4::integer OFFSET $5::integer`,
      [managed, status, type, limit, offset]
    ));
    return { items: result.rows.map(mapRequest), total: Number(result.rows[0]?.total_count || 0) };
  }

  async getArcoRequest({ userId, requestId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT request_id, user_account_id, type, description, status, requested_at, deadline_at,
              answered_at, answer, answered_by, attachment_document, created_at, updated_at
         FROM privacy.arco_request WHERE request_id = $1::uuid LIMIT 1`, [requestId]
    ));
    if (!result.rowCount) { const error = new Error('Solicitud ARCO no encontrada'); error.status = 404; throw error; }
    return mapRequest(result.rows[0]);
  }

  async updateArcoRequest({ userId, requestId, status, answer }) {
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE privacy.arco_request
          SET status = $2::varchar,
              answer = $3::text,
              answered_at = CASE WHEN $2::varchar IN ('Resolved', 'Rejected') THEN now() ELSE NULL END,
              answered_by = CASE WHEN $2::varchar IN ('Resolved', 'Rejected') THEN user_account.fn_app_current_user_id() ELSE NULL END,
              updated_at = now()
        WHERE request_id = $1::uuid
        RETURNING request_id, user_account_id, type, description, status, requested_at, deadline_at,
                  answered_at, answer, answered_by, attachment_document, created_at, updated_at`,
      [requestId, status, answer]
    ));
    if (!result.rowCount) { const error = new Error('Solicitud ARCO no encontrada'); error.status = 404; throw error; }
    return mapRequest(result.rows[0]);
  }
}

module.exports = { PostgresPrivacyRepository };

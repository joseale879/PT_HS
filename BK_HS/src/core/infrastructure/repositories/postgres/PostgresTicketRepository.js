const { withTransaction } = require('../../../../infrastructure/db');
const { TicketRepository } = require('../../../application/ports/repositories/TicketRepository');

const ticketSelect = `
  SELECT t.ticket_id, t.user_account_id, t.title, t.description,
         c.name AS category, p.name AS priority, s.name AS status,
         t.assigned_to,
         t.created_at, t.updated_at, t.resolved_at, t.closed_at, t.attachment_url
    FROM analytics_support.ticket t
    JOIN analytics_support.ticket_category c ON c.category_id = t.category_id
    JOIN analytics_support.ticket_priority p ON p.priority_id = t.priority_id
    JOIN analytics_support.ticket_status s ON s.status_id = t.status_id`;

class PostgresTicketRepository extends TicketRepository {
  async listCategories({ userId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT category_id, name FROM analytics_support.ticket_category WHERE active = TRUE ORDER BY name`
    ));
    return result.rows.map((row) => ({ categoryId: row.category_id, name: row.name }));
  }

  map(row) {
    return {
      ticketId: row.ticket_id,
      userId: row.user_account_id,
      title: row.title,
      description: row.description,
      category: row.category,
      priority: row.priority,
      status: row.status,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      closedAt: row.closed_at,
      attachmentUrl: row.attachment_url
    };
  }

  async create({ userId, category, priority, title, description }) {
    const result = await withTransaction(userId, (client) => client.query(
      `INSERT INTO analytics_support.ticket (user_account_id, category_id, priority_id, status_id, title, description)
       SELECT $1::uuid, c.category_id, p.priority_id, s.status_id, $4::varchar, $5::text
         FROM analytics_support.ticket_category c
         CROSS JOIN analytics_support.ticket_priority p
         CROSS JOIN analytics_support.ticket_status s
        WHERE lower(c.name) = lower($2::varchar) AND c.active = TRUE
          AND lower(p.name) = lower($3::varchar) AND s.name = 'Abierto'
       RETURNING ticket_id, user_account_id, title, description, created_at`,
      [userId, category, priority, title, description]
    ));
    if (!result.rowCount) { const error = new Error('Categoría o prioridad no válida'); error.status = 400; throw error; }
    return { ticketId: result.rows[0].ticket_id, userId, title, description, category, priority, status: 'Abierto', createdAt: result.rows[0].created_at };
  }

  async list({ userId }) {
    const result = await withTransaction(userId, (client) => client.query(`${ticketSelect} ORDER BY t.created_at DESC`));
    return result.rows.map((row) => this.map(row));
  }

  async get({ userId, ticketId }) {
    const result = await withTransaction(userId, (client) => client.query(`${ticketSelect} WHERE t.ticket_id = $1::uuid LIMIT 1`, [ticketId]));
    if (!result.rowCount) { const error = new Error('Ticket no encontrado'); error.status = 404; throw error; }
    return this.map(result.rows[0]);
  }

  async update({ userId, ticketId, status, priority, assignedTo }) {
    const values = [ticketId];
    const changes = ['updated_at = now()'];
    if (status !== undefined) {
      values.push(status);
      changes.push(`status_id = (SELECT status_id FROM analytics_support.ticket_status WHERE lower(name) = lower($${values.length}::varchar))`);
      changes.push(`resolved_at = CASE WHEN lower($${values.length}::varchar) IN ('resuelto','cerrado') THEN COALESCE(resolved_at, now()) ELSE NULL END`);
      changes.push(`closed_at = CASE WHEN lower($${values.length}::varchar) = 'cerrado' THEN COALESCE(closed_at, now()) ELSE NULL END`);
    }
    if (priority !== undefined) {
      values.push(priority);
      changes.push(`priority_id = (SELECT priority_id FROM analytics_support.ticket_priority WHERE lower(name) = lower($${values.length}::varchar))`);
    }
    if (assignedTo !== undefined) {
      values.push(assignedTo);
      changes.push(`assigned_to = $${values.length}::uuid`);
    }
    const result = await withTransaction(userId, (client) => client.query(
      `UPDATE analytics_support.ticket t SET ${changes.join(', ')}
        WHERE t.ticket_id = $1::uuid
        RETURNING t.ticket_id`, values));
    if (!result.rowCount) { const error = new Error('Ticket no encontrado'); error.status = 404; throw error; }
    return this.get({ userId, ticketId });
  }

  async respond({ userId, ticketId, message }) {
    const result = await withTransaction(userId, async (client) => {
      const ticket = await client.query('SELECT ticket_id FROM analytics_support.ticket WHERE ticket_id = $1::uuid LIMIT 1', [ticketId]);
      if (!ticket.rowCount) return null;
      const response = await client.query(
        `INSERT INTO analytics_support.ticket_response (ticket_id, user_account_id, message)
         VALUES ($1::uuid, $2::uuid, $3::text)
         RETURNING response_id, ticket_id, user_account_id, message, created_at`, [ticketId, userId, message]);
      return response.rows[0];
    });
    if (!result) { const error = new Error('Ticket no encontrado'); error.status = 404; throw error; }
    return { responseId: result.response_id, ticketId: result.ticket_id, userId: result.user_account_id, message: result.message, createdAt: result.created_at };
  }

  async listResponses({ userId, ticketId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT tr.response_id, tr.ticket_id, tr.user_account_id, tr.message, tr.created_at
         FROM analytics_support.ticket_response tr
         JOIN analytics_support.ticket t ON t.ticket_id = tr.ticket_id
        WHERE tr.ticket_id = $1::uuid
        ORDER BY tr.created_at ASC`, [ticketId]));
    return result.rows.map((row) => ({ responseId: row.response_id, ticketId: row.ticket_id, userId: row.user_account_id, message: row.message, createdAt: row.created_at }));
  }
}

module.exports = { PostgresTicketRepository };

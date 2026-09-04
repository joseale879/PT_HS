const { paginate } = require('../../shared/http');
class TicketController {
  constructor(dependencies) { Object.assign(this, dependencies); }
  async create(req, res) { res.status(201).json({ data: await this.createTicket.execute({ userId: req.user.id, ...req.body }) }); }
  async categories(req, res) { res.json({ data: await this.listTicketCategories.execute({ userId: req.user.id }) }); }
  async list(req, res) { const result = paginate(await this.listTickets.execute({ userId: req.user.id }), req.query, { sortFields: ['title', 'status', 'priority', 'createdAt'], filter: (ticket) => (!req.query.status || ticket.status === req.query.status) && (!req.query.priority || ticket.priority === req.query.priority) }); res.json({ data: result.items, pagination: result.pagination }); }
  async get(req, res) { res.json({ data: await this.getTicket.execute({ userId: req.user.id, ticketId: req.params.ticketId }) }); }
  async update(req, res) { res.json({ data: await this.updateTicket.execute({ userId: req.user.id, ticketId: req.params.ticketId, status: req.body?.status, priority: req.body?.priority, assignedTo: req.body?.assignedTo }) }); }
  async respond(req, res) { res.status(201).json({ data: await this.respondTicket.execute({ userId: req.user.id, ticketId: req.params.ticketId, message: req.body?.message }) }); }
  async responses(req, res) { res.json({ data: await this.listTicketResponses.execute({ userId: req.user.id, ticketId: req.params.ticketId }) }); }
}

module.exports = { TicketController };

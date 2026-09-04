function uuid(value, field) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    const error = new Error(`${field} no es válido`);
    error.status = 400;
    throw error;
  }
}

function text(value, field, max) {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > max) {
    const error = new Error(`${field} no es válido`);
    error.status = 400;
    throw error;
  }
  return value.trim();
}

class CreateTicket {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, category, priority, title, description }) {
    uuid(userId, 'userId');
    return this.repository.create({
      userId,
      category: text(category, 'category', 50),
      priority: priority ? text(priority, 'priority', 20) : 'Media',
      title: text(title, 'title', 200),
      description: text(description, 'description', 5000)
    });
  }
}

class ListTickets {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId }) { uuid(userId, 'userId'); return this.repository.list({ userId }); }
}

class ListTicketCategories {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId }) { uuid(userId, 'userId'); return this.repository.listCategories({ userId }); }
}

class GetTicket {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, ticketId }) { uuid(userId, 'userId'); uuid(ticketId, 'ticketId'); return this.repository.get({ userId, ticketId }); }
}

class UpdateTicket {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, ticketId, status, priority, assignedTo }) {
    uuid(userId, 'userId'); uuid(ticketId, 'ticketId');
    if (status === undefined && priority === undefined && assignedTo === undefined) {
      const error = new Error('Debe indicar status, priority o assignedTo'); error.status = 400; throw error;
    }
    return this.repository.update({
      userId, ticketId,
      ...(status === undefined ? {} : { status: text(status, 'status', 20) }),
      ...(priority === undefined ? {} : { priority: text(priority, 'priority', 20) }),
      ...(assignedTo === undefined || assignedTo === null ? { assignedTo } : (uuid(assignedTo, 'assignedTo'), { assignedTo }))
    });
  }
}

class RespondTicket {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, ticketId, message }) { uuid(userId, 'userId'); uuid(ticketId, 'ticketId'); return this.repository.respond({ userId, ticketId, message: text(message, 'message', 5000) }); }
}

class ListTicketResponses {
  constructor({ repository }) { this.repository = repository; }
  execute({ userId, ticketId }) { uuid(userId, 'userId'); uuid(ticketId, 'ticketId'); return this.repository.listResponses({ userId, ticketId }); }
}

module.exports = { CreateTicket, ListTickets, ListTicketCategories, GetTicket, UpdateTicket, RespondTicket, ListTicketResponses };

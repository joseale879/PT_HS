const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { CreateTicket, ListTickets, ListTicketCategories, GetTicket, UpdateTicket, RespondTicket, ListTicketResponses } = require('../core/application/use-cases/ticket/TicketOperations');
const { PostgresTicketRepository } = require('../core/infrastructure/repositories/postgres/PostgresTicketRepository');
const { TicketController } = require('./controllers/TicketController');

const repository = new PostgresTicketRepository();
const controller = new TicketController({
  createTicket: new CreateTicket({ repository }),
  listTicketCategories: new ListTicketCategories({ repository }),
  listTickets: new ListTickets({ repository }),
  getTicket: new GetTicket({ repository }),
  updateTicket: new UpdateTicket({ repository }),
  respondTicket: new RespondTicket({ repository }),
  listTicketResponses: new ListTicketResponses({ repository })
});
const requireSupport = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('tickets.manage');
const requireHomeManagement = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('homes.manage');

router.use(authenticate);
router.get('/catalogs', asyncHandler((req, res) => controller.categories(req, res)));
router.get('/tickets', asyncHandler((req, res) => controller.list(req, res)));
router.get('/tickets/:ticketId', asyncHandler((req, res) => controller.get(req, res)));
router.get('/tickets/:ticketId/responses', asyncHandler((req, res) => controller.responses(req, res)));
router.post('/tickets', requireHomeManagement, asyncHandler((req, res) => controller.create(req, res)));
router.patch('/tickets/:ticketId', requireSupport, asyncHandler((req, res) => controller.update(req, res)));
router.post('/tickets/:ticketId/responses', requireSupport, asyncHandler((req, res) => controller.respond(req, res)));

module.exports = router;

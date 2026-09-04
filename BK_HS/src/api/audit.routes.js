const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { ListAuditLogs } = require('../core/application/use-cases/audit/ListAuditLogs');
const { PostgresAuditRepository } = require('../core/infrastructure/repositories/postgres/PostgresAuditRepository');
const { AuditController } = require('./controllers/AuditController');

const repository = new PostgresAuditRepository();
const controller = new AuditController({ listAuditLogs: new ListAuditLogs({ repository }) });
const requireAuditRead = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('audit.read');

router.use(authenticate, requireAuditRead);
router.get('/logs', asyncHandler((req, res) => controller.list(req, res)));

module.exports = router;

const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { ExportUserData, ListConsents, CreateConsent, CreateArcoRequest, ListArcoRequests, GetArcoRequest, UpdateArcoRequest } = require('../core/application/use-cases/privacy/PrivacyOperations');
const { PostgresPrivacyRepository } = require('../core/infrastructure/repositories/postgres/PostgresPrivacyRepository');
const { PrivacyController } = require('./controllers/PrivacyController');

const repository = new PostgresPrivacyRepository();
const controller = new PrivacyController({
  exportDataUseCase: new ExportUserData({ repository }),
  listConsentsUseCase: new ListConsents({ repository }),
  createConsentUseCase: new CreateConsent({ repository }),
  createRequestUseCase: new CreateArcoRequest({ repository }),
  listRequestsUseCase: new ListArcoRequests({ repository }),
  getRequestUseCase: new GetArcoRequest({ repository }),
  updateRequestUseCase: new UpdateArcoRequest({ repository })
});
const requireUsersManage = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('users.manage');

router.use(authenticate);
router.get('/export', asyncHandler((req, res) => controller.exportData(req, res)));
router.get('/consents', asyncHandler((req, res) => controller.listConsents(req, res)));
router.post('/consents', asyncHandler((req, res) => controller.createConsent(req, res)));
router.post('/requests', asyncHandler((req, res) => controller.createRequest(req, res)));
router.get('/requests/manage', requireUsersManage, asyncHandler((req, res) => controller.listRequests(req, res)));
router.get('/requests', asyncHandler((req, res) => controller.listRequests(req, res)));
router.get('/requests/:requestId', asyncHandler((req, res) => controller.getRequest(req, res)));
router.patch('/requests/:requestId', requireUsersManage, asyncHandler((req, res) => controller.updateRequest(req, res)));

module.exports = router;

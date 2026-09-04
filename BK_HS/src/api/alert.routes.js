const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { GetPendingAlerts } = require('../core/application/use-cases/alert/GetPendingAlerts');
const { UpdateAlertStatus } = require('../core/application/use-cases/alert/UpdateAlertStatus');
const { CreateAlertRule } = require('../core/application/use-cases/alert/CreateAlertRule');
const { ListAlertRules } = require('../core/application/use-cases/alert/ListAlertRules');
const { UpdateAlertRule } = require('../core/application/use-cases/alert/UpdateAlertRule');
const { DeleteAlertRule } = require('../core/application/use-cases/alert/DeleteAlertRule');
const { GetThresholdConfiguration } = require('../core/application/use-cases/alert/GetThresholdConfiguration');
const { SaveThresholdConfiguration } = require('../core/application/use-cases/alert/SaveThresholdConfiguration');
const { DeleteThresholdConfiguration } = require('../core/application/use-cases/alert/DeleteThresholdConfiguration');
const { ListAlertHistory } = require('../core/application/use-cases/alert/ListAlertHistory');
const { PostgresAlertRepository } = require('../core/infrastructure/repositories/postgres/PostgresAlertRepository');
const { AlertController } = require('./controllers/AlertController');

const alertRepository = new PostgresAlertRepository();
const alertController = new AlertController({
  getPendingAlerts: new GetPendingAlerts({ alertRepository }),
  updateAlertStatus: new UpdateAlertStatus({ alertRepository }),
  createAlertRule: new CreateAlertRule({ alertRepository }),
  listAlertRules: new ListAlertRules({ alertRepository }),
  updateAlertRule: new UpdateAlertRule({ alertRepository }),
  deleteAlertRule: new DeleteAlertRule({ alertRepository }),
  getThresholdConfiguration: new GetThresholdConfiguration({ alertRepository }),
  saveThresholdConfiguration: new SaveThresholdConfiguration({ alertRepository }),
  deleteThresholdConfiguration: new DeleteThresholdConfiguration({ alertRepository })
  ,listAlertHistory: new ListAlertHistory({ alertRepository })
});

router.use(authenticate);
const requireManage = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('alerts.manage');
router.get('/home/:homeId/pending', asyncHandler((req, res) => alertController.pendingByHome(req, res)));
router.patch('/:alertId/status', requireManage, asyncHandler((req, res) => alertController.updateStatus(req, res)));
router.post('/home/:homeId/rules', requireManage, asyncHandler((req, res) => alertController.createRule(req, res)));
router.get('/home/:homeId/rules', asyncHandler((req, res) => alertController.listRules(req, res)));
router.get('/home/:homeId/history', asyncHandler((req, res) => alertController.history(req, res)));
router.patch('/rules/:ruleId', requireManage, asyncHandler((req, res) => alertController.updateRule(req, res)));
router.delete('/rules/:ruleId', requireManage, asyncHandler((req, res) => alertController.deleteRule(req, res)));
router.get('/home/:homeId/thresholds', asyncHandler((req, res) => alertController.getThreshold(req, res)));
router.put('/home/:homeId/thresholds', requireManage, asyncHandler((req, res) => alertController.saveThreshold(req, res)));
router.delete('/home/:homeId/thresholds', requireManage, asyncHandler((req, res) => alertController.deleteThreshold(req, res)));

module.exports = router;

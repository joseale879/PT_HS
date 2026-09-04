const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { GetConsumptionSummary } = require('../core/application/use-cases/consumption/GetConsumptionSummary');
const { GetDailyConsumption } = require('../core/application/use-cases/consumption/GetDailyConsumption');
const { GetMonthlyConsumption } = require('../core/application/use-cases/consumption/GetMonthlyConsumption');
const { GetHourlyConsumption } = require('../core/application/use-cases/consumption/GetHourlyConsumption');
const { GetPeriodCost } = require('../core/application/use-cases/consumption/GetPeriodCost');
const { PostgresConsumptionRepository } = require('../core/infrastructure/repositories/postgres/PostgresConsumptionRepository');
const { ConsumptionController } = require('./controllers/ConsumptionController');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');

const consumptionRepository = new PostgresConsumptionRepository();
const getDailyConsumption = new GetDailyConsumption({ consumptionRepository });
const getMonthlyConsumption = new GetMonthlyConsumption({ consumptionRepository });
const getHourlyConsumption = new GetHourlyConsumption({ consumptionRepository });
const getPeriodCost = new GetPeriodCost({ consumptionRepository });
const consumptionController = new ConsumptionController({
  getConsumptionSummary: new GetConsumptionSummary({ consumptionRepository }),
  getDailyConsumption,
  getMonthlyConsumption,
  getHourlyConsumption,
  getPeriodCost
});
const requirePermission = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
});

router.use(authenticate);
router.get('/summary', requirePermission('consumption.read'), asyncHandler((req, res) => consumptionController.summary(req, res)));
router.get('/daily', requirePermission('consumption.read'), asyncHandler((req, res) => consumptionController.daily(req, res)));
router.get('/monthly', requirePermission('consumption.read'), asyncHandler((req, res) => consumptionController.monthly(req, res)));
router.get('/hourly', requirePermission('consumption.read'), asyncHandler((req, res) => consumptionController.hourly(req, res)));
router.get('/cost', requirePermission('consumption.read'), asyncHandler((req, res) => consumptionController.cost(req, res)));

module.exports = router;

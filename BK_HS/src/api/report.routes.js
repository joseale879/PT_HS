const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { GenerateConsumptionReport } = require('../core/application/use-cases/report/GenerateConsumptionReport');
const { ListGeneratedReports, GetGeneratedReport } = require('../core/application/use-cases/report/ReportOperations');
const { PostgresConsumptionRepository } = require('../core/infrastructure/repositories/postgres/PostgresConsumptionRepository');
const { PostgresReportRepository } = require('../core/infrastructure/repositories/postgres/PostgresReportRepository');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { ReportStorage } = require('../core/infrastructure/services/report/ReportStorage');
const { ReportController } = require('./controllers/ReportController');

const reportRepository = new PostgresReportRepository();
const reportController = new ReportController({
  generateConsumptionReport: new GenerateConsumptionReport({
    consumptionRepository: new PostgresConsumptionRepository()
  }),
  listGeneratedReports: new ListGeneratedReports({ repository: reportRepository }),
  getGeneratedReport: new GetGeneratedReport({ repository: reportRepository }),
  reportRepository,
  reportStorage: new ReportStorage()
});
const requirePermission = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
});

router.use(authenticate);
router.get('/history', requirePermission('reports.read'), asyncHandler((req, res) => reportController.history(req, res)));
router.get('/:reportId/download', requirePermission('reports.read'), asyncHandler((req, res) => reportController.downloadStored(req, res)));
router.get('/consumption.pdf', requirePermission('reports.read'), asyncHandler((req, res) => reportController.consumptionPdf(req, res)));
router.get('/consumption.xlsx', requirePermission('reports.read'), asyncHandler((req, res) => reportController.consumptionExcel(req, res)));

module.exports = router;

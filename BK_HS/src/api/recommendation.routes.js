const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const {
  ListRecommendations,
  UpdateRecommendation,
  GetRecommendationSummary
} = require('../core/application/use-cases/recommendation/RecommendationOperations');
const { PostgresRecommendationRepository } = require('../core/infrastructure/repositories/postgres/PostgresRecommendationRepository');
const { RecommendationController } = require('./controllers/RecommendationController');

const repository = new PostgresRecommendationRepository();
const controller = new RecommendationController({
  listRecommendations: new ListRecommendations({ repository }),
  updateRecommendation: new UpdateRecommendation({ repository }),
  getRecommendationSummary: new GetRecommendationSummary({ repository })
});
const requireReportsRead = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker()
})('reports.read');

router.use(authenticate, requireReportsRead);
router.get('/', asyncHandler((req, res) => controller.list(req, res)));
router.get('/home/:homeId/summary', asyncHandler((req, res) => controller.summary(req, res)));
router.patch('/:userRecommendationId', asyncHandler((req, res) => controller.update(req, res)));

module.exports = router;

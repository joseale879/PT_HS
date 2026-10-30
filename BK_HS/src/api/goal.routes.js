const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { CreateGoal } = require('../core/application/use-cases/goal/CreateGoal');
const { SaveGoalPlan } = require('../core/application/use-cases/goal/SaveGoalPlan');
const { ListGoals } = require('../core/application/use-cases/goal/ListGoals');
const { GetGoal } = require('../core/application/use-cases/goal/GetGoal');
const { UpdateGoal } = require('../core/application/use-cases/goal/UpdateGoal');
const { DeleteGoal } = require('../core/application/use-cases/goal/DeleteGoal');
const { GetGoalProgress } = require('../core/application/use-cases/goal/GetGoalProgress');
const { PostgresGoalRepository } = require('../core/infrastructure/repositories/postgres/PostgresGoalRepository');
const { GoalController } = require('./controllers/GoalController');

const repository = new PostgresGoalRepository();
const controller = new GoalController({
  createGoal: new CreateGoal({ repository }),
  saveGoalPlan: new SaveGoalPlan({ repository }),
  listGoals: new ListGoals({ repository }),
  getGoal: new GetGoal({ repository }),
  updateGoal: new UpdateGoal({ repository }),
  deleteGoal: new DeleteGoal({ repository }),
  getGoalProgress: new GetGoalProgress({ repository }),
});
const requireManage = createRequirePermission({
  permissionChecker: new PostgresPermissionChecker(),
})('homes.manage');

router.use(authenticate);
router.post('/', requireManage, asyncHandler((req, res) => controller.create(req, res)));
router.put('/plan', requireManage, asyncHandler((req, res) => controller.savePlan(req, res)));
router.get('/', asyncHandler((req, res) => controller.list(req, res)));
router.get('/:goalId/progress', asyncHandler((req, res) => controller.progress(req, res)));
router.get('/:goalId', asyncHandler((req, res) => controller.get(req, res)));
router.put('/:goalId', requireManage, asyncHandler((req, res) => controller.update(req, res)));
router.delete('/:goalId', requireManage, asyncHandler((req, res) => controller.remove(req, res)));

module.exports = router;

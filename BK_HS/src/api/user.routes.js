const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { GetCurrentUser } = require('../core/application/use-cases/user/GetCurrentUser');
const { UpdateCurrentUser } = require('../core/application/use-cases/user/UpdateCurrentUser');
const { GetUserPreferences } = require('../core/application/use-cases/user/GetUserPreferences');
const { UpdateUserPreferences } = require('../core/application/use-cases/user/UpdateUserPreferences');
const { PostgresUserRepository } = require('../core/infrastructure/repositories/postgres/PostgresUserRepository');
const { UserController } = require('./controllers/UserController');
const userRepository = new PostgresUserRepository();
const userController = new UserController({
  getCurrentUser: new GetCurrentUser({ userRepository }),
  updateCurrentUser: new UpdateCurrentUser({ userRepository }),
  getUserPreferences: new GetUserPreferences({ userRepository }),
  updateUserPreferences: new UpdateUserPreferences({ userRepository })
});
router.use(authenticate);
router.get('/me', asyncHandler((req, res) => userController.getMe(req, res)));
router.put('/me', asyncHandler((req, res) => userController.updateMe(req, res)));
router.get('/me/preferences', asyncHandler((req, res) => userController.getPreferences(req, res)));
router.put('/me/preferences', asyncHandler((req, res) => userController.updatePreferences(req, res)));
module.exports = router;

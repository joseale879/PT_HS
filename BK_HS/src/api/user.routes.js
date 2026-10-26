const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { GetCurrentUser } = require('../core/application/use-cases/user/GetCurrentUser');
const { UpdateCurrentUser } = require('../core/application/use-cases/user/UpdateCurrentUser');
const { GetUserPreferences } = require('../core/application/use-cases/user/GetUserPreferences');
const { UpdateUserPreferences } = require('../core/application/use-cases/user/UpdateUserPreferences');
const { GetNotificationPreferences } = require('../core/application/use-cases/user/GetNotificationPreferences');
const { UpdateNotificationPreferences } = require('../core/application/use-cases/user/UpdateNotificationPreferences');
const { PostgresUserRepository } = require('../core/infrastructure/repositories/postgres/PostgresUserRepository');
const { GetAuthorizationContext } = require('../core/application/use-cases/user/GetAuthorizationContext');
const { AccountAdminService } = require('../core/application/services/user/AccountAdminService');
const { createRequirePermission } = require('./middleware/requirePermission');
const { PostgresPermissionChecker } = require('../core/infrastructure/security/PostgresPermissionChecker');
const { UserController } = require('./controllers/UserController');
const { NotificationService } = require('../core/application/services/notifications/NotificationService');
const { SmtpEmailSender } = require('../core/infrastructure/notifications/SmtpEmailSender');
const { getEnv } = require('../config/env');
const userRepository = new PostgresUserRepository();
const env = getEnv();
const notificationService = new NotificationService({ sender: new SmtpEmailSender({ smtp: env.smtp }), frontendUrl: env.frontendUrl, passwordResetUrl: env.passwordResetUrl });
const userController = new UserController({
  getCurrentUser: new GetCurrentUser({ userRepository }),
  updateCurrentUser: new UpdateCurrentUser({ userRepository, notificationService }),
  getUserPreferences: new GetUserPreferences({ userRepository }),
  updateUserPreferences: new UpdateUserPreferences({ userRepository }),
  getNotificationPreferences: new GetNotificationPreferences({ userRepository }),
  updateNotificationPreferences: new UpdateNotificationPreferences({ userRepository }),
  getAuthorizationContext: new GetAuthorizationContext({ userRepository })
  , accountAdminService: new AccountAdminService({ userRepository, notificationService })
});
const requireUsersManage = createRequirePermission({ permissionChecker: new PostgresPermissionChecker() })('users.manage');
router.use(authenticate);
router.get('/', requireUsersManage, asyncHandler((req, res) => userController.listUsers(req, res)));
router.get('/me', asyncHandler((req, res) => userController.getMe(req, res)));
router.put('/me', asyncHandler((req, res) => userController.updateMe(req, res)));
router.get('/me/preferences', asyncHandler((req, res) => userController.getPreferences(req, res)));
router.put('/me/preferences', asyncHandler((req, res) => userController.updatePreferences(req, res)));
router.get('/me/notifications', asyncHandler((req, res) => userController.getNotificationPreferences(req, res)));
router.put('/me/notifications', asyncHandler((req, res) => userController.updateNotificationPreferences(req, res)));
router.patch('/:userId/status', requireUsersManage, asyncHandler((req, res) => userController.changeStatus(req, res)));
router.delete('/:userId', requireUsersManage, asyncHandler((req, res) => userController.deleteAccount(req, res)));
module.exports = router;

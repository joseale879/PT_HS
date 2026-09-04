const router = require('express').Router();
const { asyncHandler } = require('../shared/http');
const { authenticate } = require('./middleware/auth');
const { RegisterUser } = require('../core/application/use-cases/auth/RegisterUser');
const { LoginUser } = require('../core/application/use-cases/auth/LoginUser');
const { PostgresAuthRepository } = require('../core/infrastructure/repositories/postgres/PostgresAuthRepository');
const { BcryptPasswordHasher } = require('../core/infrastructure/security/BcryptPasswordHasher');
const { JwtTokenService } = require('../core/infrastructure/security/JwtTokenService');
const { AuthSessionService } = require('../core/application/services/auth/AuthSessionService');
const { PasswordTokenService } = require('../core/application/services/auth/PasswordTokenService');
const { ChangePassword } = require('../core/application/use-cases/auth/ChangePassword');
const { RequestPasswordReset } = require('../core/application/use-cases/auth/RequestPasswordReset');
const { ResetPassword } = require('../core/application/use-cases/auth/ResetPassword');
const { NotificationService } = require('../core/application/services/notifications/NotificationService');
const { SmtpEmailSender } = require('../core/infrastructure/notifications/SmtpEmailSender');
const { getEnv } = require('../config/env');
const { AuthController } = require('./controllers/AuthController');
const { createAuthRateLimiter } = require('./middleware/authRateLimit');

const authRepository = new PostgresAuthRepository();
const passwordHasher = new BcryptPasswordHasher();
const passwordTokenService = new PasswordTokenService();
const env = getEnv();
const authRateLimiter = createAuthRateLimiter({
  windowMs: env.authRateLimitWindowMs,
  limit: env.authRateLimitMax
});
const notificationService = new NotificationService({
  sender: new SmtpEmailSender({ smtp: env.smtp }),
  frontendUrl: env.frontendUrl,
  passwordResetUrl: env.passwordResetUrl
});
const authController = new AuthController({
  registerUser: new RegisterUser({ authRepository, passwordHasher }),
  loginUser: new LoginUser({ authRepository, passwordHasher }),
  sessionService: new AuthSessionService({ authRepository, tokenService: new JwtTokenService() }),
  changePassword: new ChangePassword({ authRepository, passwordHasher }),
  requestPasswordReset: new RequestPasswordReset({ authRepository, tokenService: passwordTokenService, notificationService }),
  resetPassword: new ResetPassword({ authRepository, passwordHasher, tokenService: passwordTokenService })
});

router.use(authRateLimiter);
router.post('/register', asyncHandler((req, res) => authController.register(req, res)));
router.post('/login', asyncHandler((req, res) => authController.login(req, res)));
router.post('/refresh', asyncHandler((req, res) => authController.refresh(req, res)));
router.post('/logout', authenticate, asyncHandler((req, res) => authController.logout(req, res)));
router.post('/change-password', authenticate, asyncHandler((req, res) => authController.change(req, res)));
router.post('/request-password-reset', asyncHandler((req, res) => authController.requestReset(req, res)));
router.post('/reset-password', asyncHandler((req, res) => authController.reset(req, res)));

module.exports = router;

const { RegisterUserRequest } = require('../../core/application/dtos/requests/RegisterUserRequest');
const { LoginRequest } = require('../../core/application/dtos/requests/LoginRequest');
const { AuthResponse } = require('../../core/application/dtos/responses/AuthResponse');
const { ChangePasswordRequest } = require('../../core/application/dtos/requests/ChangePasswordRequest');
const { RequestPasswordResetRequest } = require('../../core/application/dtos/requests/RequestPasswordResetRequest');
const { ResetPasswordRequest } = require('../../core/application/dtos/requests/ResetPasswordRequest');

class AuthController {
  constructor({ registerUser, loginUser, sessionService, changePassword, requestPasswordReset, resetPassword, getPasswordResetContext, resendEmailVerification, verifyEmail, notificationService, logger = console }) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.sessionService = sessionService;
    this.changePassword = changePassword;
    this.requestPasswordReset = requestPasswordReset;
    this.resetPassword = resetPassword;
    this.getPasswordResetContext = getPasswordResetContext;
    this.resendEmailVerification = resendEmailVerification;
    this.verifyEmail = verifyEmail;
    this.notificationService = notificationService;
    this.logger = logger;
  }

  async register(req, res) {
    const input = RegisterUserRequest.fromRequest(req.body);
    await this.registerUser.execute({ ...input, sourceIp: req.ip, userAgent: req.get('user-agent') || null });
    res.status(202).json({
      data: {
        message: 'Revisa tu correo para activar la cuenta.',
        email: input.email
      }
    });
  }

  async login(req, res) {
    const input = LoginRequest.fromRequest(req.body);
    const result = await this.loginUser.execute({ ...input, sourceIp: req.ip });
    const session = await this.sessionService.create(result.userId, this.meta(req));
    res.json({ data: AuthResponse.fromSession(session) });
  }

  async refresh(req, res) {
    const session = await this.sessionService.refresh(req.body?.refreshToken, this.meta(req));
    res.json({ data: AuthResponse.fromSession(session) });
  }

  async logout(req, res) {
    await this.sessionService.revoke({ refreshToken: req.body?.refreshToken, userId: req.user.id, sessionId: req.user.sessionId });
    res.status(204).send();
  }

  async listSessions(req, res) {
    const sessions = await this.sessionService.list({ userId: req.user.id, currentSessionId: req.user.sessionId });
    res.json({ data: sessions });
  }

  async revokeSession(req, res) {
    await this.sessionService.revokeSession({ userId: req.user.id, sessionId: req.params.sessionId });
    res.status(204).send();
  }

  async revokeOtherSessions(req, res) {
    const revokedCount = await this.sessionService.revokeOtherSessions({ userId: req.user.id, currentSessionId: req.user.sessionId });
    res.json({ data: { revokedCount } });
  }

  async revokeAllSessions(req, res) {
    const revokedCount = await this.sessionService.revokeAllSessions({ userId: req.user.id });
    res.json({ data: { revokedCount } });
  }

  async change(req, res) {
    await this.changePassword.execute({ userId: req.user.id, ...ChangePasswordRequest.fromRequest(req.body) });
    res.status(204).send();
  }

  async requestReset(req, res) {
    await this.requestPasswordReset.execute(RequestPasswordResetRequest.fromRequest(req.body));
    res.status(202).json({ data: { message: 'Si la cuenta existe, se enviarán instrucciones de recuperación.' } });
  }

  async resendVerification(req, res) {
    await this.resendEmailVerification.execute({ email: req.body?.email || req.body?.login });
    res.status(202).json({ data: { message: 'Si la cuenta existe, se enviarán instrucciones de verificación.' } });
  }

  async verify(req, res) {
    await this.verifyEmail.execute({ token: req.body?.token || req.query?.token });
    res.status(204).send();
  }

  async reset(req, res) {
    await this.resetPassword.execute(ResetPasswordRequest.fromRequest(req.body));
    res.status(204).send();
  }

  async passwordResetContext(req, res) {
    const data = await this.getPasswordResetContext.execute({ resetToken: req.query?.resetToken });
    res.json({ data });
  }

  meta(req) {
    return { sourceIp: req.ip, userAgent: req.get('user-agent') || null };
  }
}

module.exports = { AuthController };

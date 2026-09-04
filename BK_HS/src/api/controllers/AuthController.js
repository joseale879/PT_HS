const { RegisterUserRequest } = require('../../core/application/dtos/requests/RegisterUserRequest');
const { LoginRequest } = require('../../core/application/dtos/requests/LoginRequest');
const { AuthResponse } = require('../../core/application/dtos/responses/AuthResponse');
const { ChangePasswordRequest } = require('../../core/application/dtos/requests/ChangePasswordRequest');
const { RequestPasswordResetRequest } = require('../../core/application/dtos/requests/RequestPasswordResetRequest');
const { ResetPasswordRequest } = require('../../core/application/dtos/requests/ResetPasswordRequest');

class AuthController {
  constructor({ registerUser, loginUser, sessionService, changePassword, requestPasswordReset, resetPassword }) {
    this.registerUser = registerUser;
    this.loginUser = loginUser;
    this.sessionService = sessionService;
    this.changePassword = changePassword;
    this.requestPasswordReset = requestPasswordReset;
    this.resetPassword = resetPassword;
  }

  async register(req, res) {
    const input = RegisterUserRequest.fromRequest(req.body);
    const userId = await this.registerUser.execute(input);
    const session = await this.sessionService.create(userId, this.meta(req));
    res.status(201).json({ data: AuthResponse.fromSession(session) });
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
    await this.sessionService.revoke(req.body?.refreshToken);
    res.status(204).send();
  }

  async change(req, res) {
    await this.changePassword.execute({ userId: req.user.id, ...ChangePasswordRequest.fromRequest(req.body) });
    res.status(204).send();
  }

  async requestReset(req, res) {
    await this.requestPasswordReset.execute(RequestPasswordResetRequest.fromRequest(req.body));
    res.status(202).json({ data: { message: 'Si la cuenta existe, se enviarán instrucciones de recuperación.' } });
  }

  async reset(req, res) {
    await this.resetPassword.execute(ResetPasswordRequest.fromRequest(req.body));
    res.status(204).send();
  }

  meta(req) {
    return { sourceIp: req.ip, userAgent: req.get('user-agent') || null };
  }
}

module.exports = { AuthController };

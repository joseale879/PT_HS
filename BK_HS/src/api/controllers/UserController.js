const { UpdateCurrentUserRequest } = require('../../core/application/dtos/requests/UpdateCurrentUserRequest');
const { UpdateUserPreferencesRequest } = require('../../core/application/dtos/requests/UpdateUserPreferencesRequest');
const { UserResponse } = require('../../core/application/dtos/responses/UserResponse');
class UserController {
  constructor({ getCurrentUser, updateCurrentUser, getUserPreferences, updateUserPreferences, getAuthorizationContext, accountAdminService }) { this.getCurrentUser = getCurrentUser; this.updateCurrentUser = updateCurrentUser; this.getUserPreferences = getUserPreferences; this.updateUserPreferences = updateUserPreferences; this.getAuthorizationContext = getAuthorizationContext; this.accountAdminService = accountAdminService; }
  async getMe(req, res) { const user = await this.getCurrentUser.execute(req.user.id); const [preferences, authorization] = await Promise.all([this.getUserPreferences.execute(req.user.id), this.getAuthorizationContext.execute(req.user.id)]); res.json({ data: { ...UserResponse.fromEntity(user), preferences, roles: authorization.roles, permissions: authorization.permissions } }); }
  async updateMe(req, res) { const input = UpdateCurrentUserRequest.fromRequest(req.body); const user = await this.updateCurrentUser.execute({ userId: req.user.id, ...input }); res.json({ data: UserResponse.fromEntity(user) }); }
  async getPreferences(req, res) { const preference = await this.getUserPreferences.execute(req.user.id); res.json({ data: preference }); }
  async updatePreferences(req, res) { const input = UpdateUserPreferencesRequest.fromRequest(req.body); const preference = await this.updateUserPreferences.execute({ userId: req.user.id, ...input }); res.json({ data: preference }); }
  async changeStatus(req, res) { const account = await this.accountAdminService.changeStatus({ actorId: req.user.id, targetUserId: req.params.userId, status: req.body?.status, reason: req.body?.reason }); res.json({ data: account }); }
  async deleteAccount(req, res) { await this.accountAdminService.deleteAccount({ actorId: req.user.id, targetUserId: req.params.userId }); res.status(204).send(); }
  async listUsers(req, res) { const result = await this.accountAdminService.listUsers({ actorId: req.user.id, search: req.query.search, status: req.query.status, sort: req.query.sort, order: req.query.order, page: req.query.page, pageSize: req.query.pageSize }); res.json({ data: result.items, pagination: result.pagination }); }
}
module.exports = { UserController };

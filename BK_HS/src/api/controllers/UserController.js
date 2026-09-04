const { UpdateCurrentUserRequest } = require('../../core/application/dtos/requests/UpdateCurrentUserRequest');
const { UpdateUserPreferencesRequest } = require('../../core/application/dtos/requests/UpdateUserPreferencesRequest');
const { UserResponse } = require('../../core/application/dtos/responses/UserResponse');
class UserController {
  constructor({ getCurrentUser, updateCurrentUser, getUserPreferences, updateUserPreferences }) { this.getCurrentUser = getCurrentUser; this.updateCurrentUser = updateCurrentUser; this.getUserPreferences = getUserPreferences; this.updateUserPreferences = updateUserPreferences; }
  async getMe(req, res) { const user = await this.getCurrentUser.execute(req.user.id); res.json({ data: UserResponse.fromEntity(user) }); }
  async updateMe(req, res) { const input = UpdateCurrentUserRequest.fromRequest(req.body); const user = await this.updateCurrentUser.execute({ userId: req.user.id, ...input }); res.json({ data: UserResponse.fromEntity(user) }); }
  async getPreferences(req, res) { const preference = await this.getUserPreferences.execute(req.user.id); res.json({ data: preference }); }
  async updatePreferences(req, res) { const input = UpdateUserPreferencesRequest.fromRequest(req.body); const preference = await this.updateUserPreferences.execute({ userId: req.user.id, ...input }); res.json({ data: preference }); }
}
module.exports = { UserController };

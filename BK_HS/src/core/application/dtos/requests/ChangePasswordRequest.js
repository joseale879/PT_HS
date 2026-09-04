class ChangePasswordRequest {
  constructor({ currentPassword, newPassword }) {
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }

  static fromRequest(body = {}) {
    return new ChangePasswordRequest({ currentPassword: body.currentPassword, newPassword: body.newPassword });
  }
}

module.exports = { ChangePasswordRequest };

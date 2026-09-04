class ResetPasswordRequest {
  constructor({ resetToken, newPassword }) {
    this.resetToken = resetToken;
    this.newPassword = newPassword;
  }

  static fromRequest(body = {}) {
    return new ResetPasswordRequest({ resetToken: body.resetToken, newPassword: body.newPassword });
  }
}

module.exports = { ResetPasswordRequest };

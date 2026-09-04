class RequestPasswordResetRequest {
  constructor({ email }) {
    this.email = email;
  }

  static fromRequest(body = {}) {
    return new RequestPasswordResetRequest({ email: body.email || body.login });
  }
}

module.exports = { RequestPasswordResetRequest };

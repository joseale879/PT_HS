class LoginRequest {
  constructor({ login, password }) {
    this.login = login;
    this.password = password;
  }

  static fromRequest(body = {}) {
    return new LoginRequest({
      login: body.login || body.email,
      password: body.password
    });
  }
}

module.exports = { LoginRequest };

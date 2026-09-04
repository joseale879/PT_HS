class AddHomeMemberRequest {
  constructor({ email, homeRole = 'Member' }) {
    this.email = typeof email === 'string' ? email.trim().toLowerCase() : email;
    this.homeRole = homeRole;
  }

  static fromRequest(body = {}) {
    return new AddHomeMemberRequest({
      email: body.email,
      homeRole: body.homeRole || body.home_role || 'Member'
    });
  }
}

module.exports = { AddHomeMemberRequest };

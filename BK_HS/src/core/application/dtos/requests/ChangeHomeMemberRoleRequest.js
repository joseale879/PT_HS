class ChangeHomeMemberRoleRequest {
  constructor({ homeRole }) {
    this.homeRole = homeRole;
  }

  static fromRequest(body = {}) {
    return new ChangeHomeMemberRoleRequest({
      homeRole: body.homeRole || body.home_role
    });
  }
}

module.exports = { ChangeHomeMemberRoleRequest };

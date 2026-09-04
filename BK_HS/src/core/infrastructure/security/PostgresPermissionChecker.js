const { withTransaction } = require('../../../infrastructure/db');
const { PermissionChecker } = require('../../application/ports/security/PermissionChecker');

class PostgresPermissionChecker extends PermissionChecker {
  async hasPermission(userId, permission) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT user_account.fn_app_has_permission($1::varchar) AS allowed`,
      [permission]
    ));

    return result.rows[0]?.allowed === true;
  }
}

module.exports = { PostgresPermissionChecker };

function validateUuid(value, field) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    const error = new Error(`${field} no es válido`);
    error.status = 400;
    throw error;
  }
}

function validateRoleName(value) {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 50) {
    const error = new Error('roleName no es válido');
    error.status = 400;
    throw error;
  }
  return value.trim();
}

function requireAuthenticatedUser(userId) {
  if (!userId) {
    const error = new Error('El usuario autenticado es obligatorio');
    error.status = 400;
    throw error;
  }
}

class ListUserRoles {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, targetUserId }) {
    requireAuthenticatedUser(userId);
    validateUuid(targetUserId, 'targetUserId');
    return this.repository.listUserRoles({ userId, targetUserId });
  }
}

class AssignUserRole {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, targetUserId, roleName }) {
    requireAuthenticatedUser(userId);
    validateUuid(targetUserId, 'targetUserId');
    return this.repository.assign({ userId, targetUserId, roleName: validateRoleName(roleName) });
  }
}

class RemoveUserRole {
  constructor({ repository }) { this.repository = repository; }

  execute({ userId, targetUserId, roleName }) {
    requireAuthenticatedUser(userId);
    validateUuid(targetUserId, 'targetUserId');
    return this.repository.remove({ userId, targetUserId, roleName: validateRoleName(roleName) });
  }
}

module.exports = { ListUserRoles, AssignUserRole, RemoveUserRole };

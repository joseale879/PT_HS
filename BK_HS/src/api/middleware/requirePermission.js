function createRequirePermission({ permissionChecker }) {
  if (!permissionChecker || typeof permissionChecker.hasPermission !== 'function') {
    throw new Error('permissionChecker es obligatorio');
  }

  return function requirePermission(permission) {
    return async (req, _res, next) => {
      try {
        const allowed = await permissionChecker.hasPermission(req.user.id, permission);
        if (!allowed) {
          const error = new Error('No tienes permiso para realizar esta operación');
          error.status = 403;
          return next(error);
        }
        return next();
      } catch (error) {
        return next(error);
      }
    };
  };
}

module.exports = { createRequirePermission };

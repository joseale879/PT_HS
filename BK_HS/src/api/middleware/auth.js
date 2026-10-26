const { JwtTokenService } = require('../../core/infrastructure/security/JwtTokenService');
const { PostgresAuthRepository } = require('../../core/infrastructure/repositories/postgres/PostgresAuthRepository');

const tokenService = new JwtTokenService();
const authRepository = new PostgresAuthRepository();

async function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(header);
  if (!match || match[1].length > 4096) {
    const error = new Error('Se requiere un token Bearer');
    error.status = 401;
    return next(error);
  }
  try {
    const payload = tokenService.verify(match[1]);
    if (!payload.sid || !(await authRepository.isSessionActive({ userId: payload.sub, sessionId: payload.sid }))) {
      const error = new Error('La sesión ya no está activa');
      error.status = 401;
      return next(error);
    }
    req.user = { id: payload.sub, sessionId: payload.sid };
    return next();
  } catch (_error) {
    const error = new Error('Token inválido o expirado');
    error.status = 401;
    return next(error);
  }
}

module.exports = { authenticate };

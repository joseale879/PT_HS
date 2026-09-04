const { JwtTokenService } = require('../../core/infrastructure/security/JwtTokenService');

const tokenService = new JwtTokenService();

function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(header);
  if (!match || match[1].length > 4096) {
    const error = new Error('Se requiere un token Bearer');
    error.status = 401;
    return next(error);
  }
  try {
    const payload = tokenService.verify(match[1]);
    req.user = { id: payload.sub, sessionId: payload.sid || null };
    return next();
  } catch (_error) {
    const error = new Error('Token inválido o expirado');
    error.status = 401;
    return next(error);
  }
}

module.exports = { authenticate };

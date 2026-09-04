const jwt = require('jsonwebtoken');
const { getEnv } = require('../../../config/env');

class JwtTokenService {
  issue(userId, sessionId = null) {
    const config = getEnv().jwt;
    if (typeof userId !== 'string' || !userId) throw new Error('El usuario del token es obligatorio');
    return jwt.sign({ sub: userId, sid: sessionId || undefined, typ: 'access' }, config.secret, {
      algorithm: 'HS256', expiresIn: config.expiresIn, issuer: config.issuer, audience: config.audience
    });
  }

  verify(token) {
    const config = getEnv().jwt;
    const payload = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience });
    if (!payload || payload.typ !== 'access' || typeof payload.sub !== 'string' || !payload.sub) {
      throw new Error('Token de acceso inválido');
    }
    return payload;
  }
}

module.exports = { JwtTokenService };

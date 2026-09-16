const crypto = require('node:crypto');
const { getEnv } = require('../../../../config/env');

class AuthSessionService {
  constructor({ authRepository, tokenService }) {
    this.authRepository = authRepository;
    this.tokenService = tokenService;
  }

  async create(userId, { sourceIp = null, userAgent = null } = {}) {
    const refreshToken = this.generateRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    const session = await this.authRepository.createSession({
      userId,
      refreshTokenHash: this.hash(refreshToken),
      refreshExpiresAt,
      sourceIp,
      userAgent
    });
    return this.tokens(userId, session.sessionId, refreshToken, refreshExpiresAt);
  }

  async refresh(refreshToken, { sourceIp = null, userAgent = null } = {}) {
    this.requireRefreshToken(refreshToken);
    const nextRefreshToken = this.generateRefreshToken();
    const refreshExpiresAt = this.refreshExpiry();
    const session = await this.authRepository.rotateRefreshToken({
      refreshTokenHash: this.hash(refreshToken),
      newRefreshTokenHash: this.hash(nextRefreshToken),
      refreshExpiresAt,
      sourceIp,
      userAgent
    });
    return this.tokens(session.userId, session.sessionId, nextRefreshToken, refreshExpiresAt);
  }

  async revoke({ refreshToken, userId, sessionId }) {
    this.requireRefreshToken(refreshToken);
    if (typeof userId !== 'string' || typeof sessionId !== 'string') {
      const error = new Error('La sesión autenticada es obligatoria');
      error.status = 401;
      throw error;
    }
    await this.authRepository.revokeRefreshSession({ refreshTokenHash: this.hash(refreshToken), userId, sessionId });
  }

  async list({ userId, currentSessionId }) {
    this.requireIdentity(userId, currentSessionId);
    return this.authRepository.listSessions({ userId, currentSessionId });
  }

  async revokeSession({ userId, sessionId }) {
    this.requireUserId(userId);
    this.requireUuid(sessionId, 'sessionId');
    const revoked = await this.authRepository.revokeSession({ userId, sessionId });
    if (!revoked) this.notFound('La sesión no existe o ya fue cerrada');
  }

  async revokeOtherSessions({ userId, currentSessionId }) {
    this.requireIdentity(userId, currentSessionId);
    return this.authRepository.revokeOtherSessions({ userId, currentSessionId });
  }

  async revokeAllSessions({ userId }) {
    this.requireUserId(userId);
    return this.authRepository.revokeAllSessions({ userId });
  }

  tokens(userId, sessionId, refreshToken, refreshExpiresAt) {
    return {
      userId,
      sessionId,
      accessToken: this.tokenService.issue(userId, sessionId),
      refreshToken,
      refreshExpiresAt
    };
  }

  generateRefreshToken() {
    return crypto.randomBytes(32).toString('base64url');
  }

  hash(value) {
    return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
  }

  refreshExpiry() {
    const raw = getEnv().jwt.refreshExpiresIn;
    const match = /^(\d+)([smhd])$/.exec(raw);
    if (!match) throw new Error('JWT_REFRESH_EXPIRES_IN debe usar formato 15m, 24h o 30d');
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return new Date(Date.now() + Number(match[1]) * units[match[2]]);
  }

  requireRefreshToken(value) {
    if (typeof value !== 'string' || value.length < 40 || value.length > 200) {
      const error = new Error('refreshToken es obligatorio y no es válido');
      error.status = 401;
      throw error;
    }
  }

  requireIdentity(userId, sessionId) {
    this.requireUserId(userId);
    if (typeof sessionId !== 'string' || !this.isUuid(sessionId)) this.unauthorized('La sesión autenticada es obligatoria');
  }

  requireUserId(userId) {
    if (typeof userId !== 'string' || !this.isUuid(userId)) this.unauthorized('La sesión autenticada es obligatoria');
  }

  requireUuid(value, field) {
    if (typeof value !== 'string' || !this.isUuid(value)) {
      const error = new Error(`${field} no es válido`);
      error.status = 400;
      throw error;
    }
  }

  isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  unauthorized(message) {
    const error = new Error(message);
    error.status = 401;
    throw error;
  }

  notFound(message) {
    const error = new Error(message);
    error.status = 404;
    throw error;
  }
}

module.exports = { AuthSessionService };

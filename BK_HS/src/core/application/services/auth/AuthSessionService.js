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

  async revoke(refreshToken) {
    this.requireRefreshToken(refreshToken);
    await this.authRepository.revokeRefreshSession(this.hash(refreshToken));
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
}

module.exports = { AuthSessionService };

class AuthResponse {
  static fromToken(userId, accessToken) {
    return { userId, accessToken };
  }

  static fromSession(session) {
    return {
      userId: session.userId,
      sessionId: session.sessionId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      refreshExpiresAt: session.refreshExpiresAt
    };
  }
}

module.exports = { AuthResponse };

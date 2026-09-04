const { randomUUID } = require('node:crypto');
const rateLimit = require('express-rate-limit');

function createAuthRateLimiter({ windowMs = 15 * 60 * 1000, limit = 20 } = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler(req, res) {
      const requestId = req.id || req.headers['x-request-id'] || randomUUID();
      res.setHeader('X-Request-Id', requestId);
      res.status(429).json({
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Demasiadas solicitudes de autenticación. Intenta nuevamente más tarde.'
        },
        meta: { requestId }
      });
    }
  });
}

module.exports = { createAuthRateLimiter };

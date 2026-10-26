const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];

function getEnv() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const missing = required.filter((key) => key !== 'DB_HOST' && key !== 'DB_PORT' && key !== 'DB_NAME' && key !== 'DB_USER' && key !== 'DB_PASSWORD' && !process.env[key]);
  if (!hasDatabaseUrl) {
    missing.push(...['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].filter((key) => !process.env[key]));
  }
  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${[...new Set(missing)].join(', ')}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || process.env.SMTP_USER
    },
    passwordResetUrl: process.env.PASSWORD_RESET_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
    materializedViewsRefreshMs: Number(process.env.MATERIALIZED_VIEWS_REFRESH_MS || 300000),
    alertGenerationIntervalMs: Number(process.env.ALERT_GENERATION_INTERVAL_MS || 300000),
    auditCleanupIntervalMs: Number(process.env.AUDIT_CLEANUP_INTERVAL_MS || 86400000),
    auditRetentionDays: Number(process.env.AUDIT_RETENTION_DAYS || 365),
    auditCleanupBatchSize: Number(process.env.AUDIT_CLEANUP_BATCH_SIZE || 1000),
    actuatorCommandTimeoutMs: Number(process.env.ACTUATOR_COMMAND_TIMEOUT_MS || 60000),
    actuatorCommandTimeoutBatchSize: Number(process.env.ACTUATOR_COMMAND_TIMEOUT_BATCH_SIZE || 100),
    authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 900000),
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
    db: {
      ...(hasDatabaseUrl ? { connectionString: process.env.DATABASE_URL } : {}),
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: Number(process.env.DB_POOL_MAX || 10),
      ingest: {
        user: process.env.DB_INGEST_USER || process.env.DB_USER,
        password: process.env.DB_INGEST_PASSWORD || process.env.DB_PASSWORD,
        max: Number(process.env.DB_INGEST_POOL_MAX || process.env.DB_POOL_MAX || 5)
      }
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      issuer: process.env.JWT_ISSUER || 'hidro-smart-api',
      audience: process.env.JWT_AUDIENCE || 'hidro-smart-web'
    }
  };
}

module.exports = { getEnv };

const baseRequired = ['JWT_SECRET'];

function getMissingRequiredVariables() {
  const missing = [];

  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasIngestDatabaseUrl = Boolean(process.env.DB_INGEST_DATABASE_URL);

  for (const key of baseRequired) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Base de datos principal del backend
  if (!hasDatabaseUrl) {
    for (const key of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  // Base de datos para ingesta MQTT del ESP32
  // Recomendado: usar mismo host/db, pero otro usuario: hidro_smart_ingest
  if (!hasIngestDatabaseUrl) {
    for (const key of ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_INGEST_USER', 'DB_INGEST_PASSWORD']) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  return [...new Set(missing)];
}

function getEnv() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
  const hasIngestDatabaseUrl = Boolean(process.env.DB_INGEST_DATABASE_URL);

  const missing = getMissingRequiredVariables();

  if (missing.length) {
    throw new Error(`Faltan variables de entorno: ${missing.join(', ')}`);
  }

  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3000),
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT || 1025),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.SMTP_FROM || process.env.SMTP_USER
    },

    passwordResetUrl:
      process.env.PASSWORD_RESET_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173',

    materializedViewsRefreshMs: Number(
      process.env.MATERIALIZED_VIEWS_REFRESH_MS || 300000
    ),

    alertGenerationIntervalMs: Number(
      process.env.ALERT_GENERATION_INTERVAL_MS || 300000
    ),

    authRateLimitWindowMs: Number(
      process.env.AUTH_RATE_LIMIT_WINDOW_MS || 900000
    ),

    authRateLimitMax: Number(
      process.env.AUTH_RATE_LIMIT_MAX || 20
    ),

    // Pool principal del backend
    db: {
      ...(hasDatabaseUrl ? { connectionString: process.env.DATABASE_URL } : {}),
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: Number(process.env.DB_POOL_MAX || 10)
    },

    // Pool separado para consumir datos MQTT del ESP32
    ingestDb: {
      ...(hasIngestDatabaseUrl
        ? { connectionString: process.env.DB_INGEST_DATABASE_URL }
        : {}),

      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: process.env.DB_INGEST_USER,
      password: process.env.DB_INGEST_PASSWORD,
      max: Number(process.env.DB_INGEST_POOL_MAX || 5)
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
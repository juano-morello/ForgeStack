/**
 * Application configuration factory
 */

export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || process.env.API_PORT || '4000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
    failOpen: process.env.RATE_LIMIT_FAIL_OPEN !== 'false',
  },
  otel: {
    enabled: process.env.OTEL_ENABLED === 'true',
    exporterType: process.env.OTEL_EXPORTER_TYPE || 'console',
    exporterOtlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: process.env.OTEL_SERVICE_NAME || 'forgestack-api',
  },
});


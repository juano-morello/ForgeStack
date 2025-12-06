/**
 * Jest Setup File
 * Configures the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.EMAIL_FROM = 'test@forgestack.dev';
process.env.APP_URL = 'http://localhost:3000';

export {};


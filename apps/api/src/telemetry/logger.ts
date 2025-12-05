/**
 * Structured logging with Pino
 * Uses shared logger factory from @forgestack/shared
 */

import { createBaseLogger, createChildLogger, type Logger } from '@forgestack/shared';

const serviceName = process.env.OTEL_SERVICE_NAME || 'forgestack-api';

export const logger: Logger = createBaseLogger({ serviceName });

/**
 * Create a child logger for a specific module
 */
export function createLogger(name: string): Logger {
  return createChildLogger(logger, name);
}

export type { Logger };

/**
 * Structured Logger with OpenTelemetry Trace Context Injection
 * Uses shared logger factory from @forgestack/shared
 */

import { createBaseLogger, createChildLogger, type Logger } from '@forgestack/shared';

const serviceName = process.env.OTEL_SERVICE_NAME || 'forgestack-worker';

/**
 * Base logger instance with trace context injection
 */
export const logger: Logger = createBaseLogger({ serviceName });

/**
 * Create a child logger for a specific module/component
 *
 * @param name - Module or component name (e.g., 'WelcomeEmail', 'Worker')
 * @returns Child logger with module context
 *
 * @example
 * const logger = createLogger('WelcomeEmail');
 * logger.info({ userId: '123' }, 'Processing welcome email');
 */
export function createLogger(name: string): Logger {
  return createChildLogger(logger, name);
}

export type { Logger };


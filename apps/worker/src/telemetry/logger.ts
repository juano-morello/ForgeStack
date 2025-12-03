/**
 * Structured Logger with OpenTelemetry Trace Context Injection
 * 
 * Uses Pino for high-performance structured logging.
 * Automatically injects trace_id and span_id into every log entry when available.
 */

import pino from 'pino';
import { trace } from '@opentelemetry/api';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Base logger instance with trace context injection
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // JSON in production, pretty-printed in development
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },

  // Inject trace context into every log entry
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const spanContext = span.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  },

  // Standard base fields
  base: {
    service: process.env.OTEL_SERVICE_NAME || 'forgestack-worker',
    env: process.env.NODE_ENV || 'development',
  },
});

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
export function createLogger(name: string) {
  return logger.child({ module: name });
}


/**
 * Structured logging with Pino
 * Automatically injects trace context into logs
 */

import pino from 'pino';
import { trace } from '@opentelemetry/api';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // JSON in production, pretty in development
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

  // Inject trace context into every log
  mixin() {
    const span = trace.getActiveSpan();
    if (!span) return {};

    const spanContext = span.spanContext();
    return {
      trace_id: spanContext.traceId,
      span_id: spanContext.spanId,
    };
  },

  // Standard log fields
  base: {
    service: process.env.OTEL_SERVICE_NAME || 'forgestack-api',
    env: process.env.NODE_ENV || 'development',
  },
});

/**
 * Create a child logger for a specific module
 */
export function createLogger(name: string) {
  return logger.child({ module: name });
}


/**
 * Structured Logger with OpenTelemetry Trace Context Injection
 * 
 * Uses Pino for high-performance structured logging.
 * Automatically injects trace_id and span_id into every log entry when available.
 */

import pino from 'pino';
import { trace } from '@opentelemetry/api';

export interface LoggerOptions {
  serviceName: string;
  level?: string;
}

/**
 * Create a configured Pino logger instance
 */
export function createBaseLogger(options: LoggerOptions) {
  const isProduction = process.env.NODE_ENV === 'production';
  const { serviceName, level } = options;

  return pino({
    level: level || process.env.LOG_LEVEL || 'info',

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
      service: serviceName,
      env: process.env.NODE_ENV || 'development',
    },
  });
}

/**
 * Create a child logger for a specific module/component
 * 
 * @param baseLogger - The base pino logger instance
 * @param name - Module or component name (e.g., 'WelcomeEmail', 'Worker')
 * @returns Child logger with module context
 * 
 * @example
 * const logger = createChildLogger(baseLogger, 'WelcomeEmail');
 * logger.info({ userId: '123' }, 'Processing welcome email');
 */
export function createChildLogger(baseLogger: pino.Logger, name: string) {
  return baseLogger.child({ module: name });
}

export type Logger = pino.Logger;


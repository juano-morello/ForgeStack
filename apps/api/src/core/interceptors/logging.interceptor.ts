/**
 * Request logging interceptor
 * Logs request method, path, status code, and response time with trace context
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { trace } from '@opentelemetry/api';
import { createLogger } from '../../telemetry/logger';

const logger = createLogger('HTTP');

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, headers } = request;
    const startTime = Date.now();

    // Get trace context and request ID
    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;
    const requestId = request.id || 'unknown';

    logger.info(
      {
        requestId,
        method,
        path: url,
        userAgent: headers['user-agent'],
        traceId,
      },
      'Request received',
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const duration = Date.now() - startTime;

          logger.info(
            {
              requestId,
              method,
              path: url,
              statusCode: response.statusCode,
              duration,
              traceId,
            },
            'Request completed',
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          logger.error(
            {
              requestId,
              method,
              path: url,
              statusCode: error.status || 500,
              duration,
              traceId,
              error: error.message,
            },
            'Request failed',
          );
        },
      }),
    );
  }
}


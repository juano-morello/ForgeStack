/**
 * Global HTTP exception filter
 * Provides consistent error response format
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { createLogger } from '../../telemetry/logger';

/**
 * Standard error response format
 */
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * Exception response object structure from NestJS
 */
interface ExceptionResponseObject {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

/**
 * Check if the exception response should be passed through as-is
 * (e.g., health check responses with specific structure)
 */
function isPassThroughResponse(response: unknown): boolean {
  if (typeof response !== 'object' || response === null) {
    return false;
  }
  const obj = response as Record<string, unknown>;
  // Health check response has 'status', 'timestamp', and 'checks' properties
  return 'status' in obj && 'timestamp' in obj && 'checks' in obj;
}

const logger = createLogger('HttpExceptionFilter');

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status: number;
    let message: string | string[];
    let error: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Pass through structured responses (e.g., health check) as-is
      if (isPassThroughResponse(exceptionResponse)) {
        response.status(status).json(exceptionResponse);
        return;
      }

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as ExceptionResponseObject;
        message = responseObj.message || exception.message;
        error = responseObj.error || exception.name;
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      // Don't leak error details in production (explicit config or NODE_ENV)
      const hideErrorDetails = process.env.HIDE_ERROR_DETAILS === 'true' ||
        process.env.NODE_ENV === 'production';
      message = hideErrorDetails ? 'Internal server error' : exception.message;
      error = 'Internal Server Error';

      logger.error(
        {
          error: exception.message,
          stack: exception.stack,
        },
        'Unhandled exception',
      );
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      error = 'Internal Server Error';

      logger.error({ exception }, 'Unknown exception type');
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}


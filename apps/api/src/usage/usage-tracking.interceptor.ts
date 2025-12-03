/**
 * Usage Tracking Interceptor
 * Tracks API calls for billing purposes
 * Fire-and-forget: doesn't block response
 */

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UsageTrackingService } from './usage-tracking.service';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(private usageTrackingService: UsageTrackingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget: don't block response
          this.trackRequest(request, Date.now() - startTime).catch((error) => {
            // Silently ignore tracking errors
            this.logger.warn(`Failed to track request: ${error.message}`);
          });
        },
        error: () => {
          // Track failed requests too
          this.trackRequest(request, Date.now() - startTime).catch((error) => {
            this.logger.warn(`Failed to track failed request: ${error.message}`);
          });
        },
      }),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async trackRequest(request: Record<string, any>, durationMs: number): Promise<void> {
    // Only track requests with org context
    const orgId = request.tenantContext?.orgId;
    if (!orgId) {
      return;
    }

    // Skip tracking for certain endpoints
    if (this.shouldSkipTracking(request)) {
      return;
    }

    await this.usageTrackingService.trackApiCall(orgId, {
      endpoint: request.route?.path || request.url,
      method: request.method,
      durationMs,
      timestamp: new Date(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private shouldSkipTracking(request: Record<string, any>): boolean {
    const path = request.route?.path || request.url;

    // Skip health checks
    if (path.includes('/health')) {
      return true;
    }

    // Skip metrics endpoints
    if (path.includes('/metrics')) {
      return true;
    }

    // Skip webhook endpoints (they're not user-initiated)
    if (path.includes('/webhook')) {
      return true;
    }

    return false;
  }
}


/**
 * Usage Tracking Interceptor Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { UsageTrackingInterceptor } from './usage-tracking.interceptor';
import { UsageTrackingService } from './usage-tracking.service';

describe('UsageTrackingInterceptor', () => {
  let interceptor: UsageTrackingInterceptor;
  let usageTrackingService: jest.Mocked<UsageTrackingService>;

  beforeEach(async () => {
    const mockUsageTrackingService = {
      trackApiCall: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingInterceptor,
        {
          provide: UsageTrackingService,
          useValue: mockUsageTrackingService,
        },
      ],
    }).compile();

    interceptor = module.get<UsageTrackingInterceptor>(UsageTrackingInterceptor);
    usageTrackingService = module.get(UsageTrackingService);

    jest.clearAllMocks();
  });

  const createMockExecutionContext = (request: unknown): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: jest.fn(),
        getNext: jest.fn(),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  const createMockCallHandler = (response: unknown = {}): CallHandler => {
    return {
      handle: () => of(response),
    };
  };

  describe('intercept', () => {
    it('should track API call for requests with tenant context', (done) => {
      const mockRequest = {
        tenantContext: { orgId: 'org-123', userId: 'user-123' },
        route: { path: '/api/projects' },
        method: 'GET',
        url: '/api/projects',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          // Give time for async tracking to complete
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).toHaveBeenCalledWith(
              'org-123',
              expect.objectContaining({
                endpoint: '/api/projects',
                method: 'GET',
                durationMs: expect.any(Number),
                timestamp: expect.any(Date),
              }),
            );
            done();
          }, 10);
        },
      });
    });

    it('should not track requests without tenant context', (done) => {
      const mockRequest = {
        route: { path: '/api/projects' },
        method: 'GET',
        url: '/api/projects',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).not.toHaveBeenCalled();
            done();
          }, 10);
        },
      });
    });

    it('should skip tracking for health check endpoints', (done) => {
      const mockRequest = {
        tenantContext: { orgId: 'org-123', userId: 'user-123' },
        route: { path: '/health' },
        method: 'GET',
        url: '/health',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).not.toHaveBeenCalled();
            done();
          }, 10);
        },
      });
    });

    it('should skip tracking for metrics endpoints', (done) => {
      const mockRequest = {
        tenantContext: { orgId: 'org-123', userId: 'user-123' },
        route: { path: '/metrics' },
        method: 'GET',
        url: '/metrics',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).not.toHaveBeenCalled();
            done();
          }, 10);
        },
      });
    });

    it('should skip tracking for webhook endpoints', (done) => {
      const mockRequest = {
        tenantContext: { orgId: 'org-123', userId: 'user-123' },
        route: { path: '/webhook/stripe' },
        method: 'POST',
        url: '/webhook/stripe',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = createMockCallHandler();

      interceptor.intercept(context, next).subscribe({
        next: () => {
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).not.toHaveBeenCalled();
            done();
          }, 10);
        },
      });
    });

    it('should track failed requests', (done) => {
      const mockRequest = {
        tenantContext: { orgId: 'org-123', userId: 'user-123' },
        route: { path: '/api/projects' },
        method: 'GET',
        url: '/api/projects',
      };

      const context = createMockExecutionContext(mockRequest);
      const next = {
        handle: () => throwError(() => new Error('Request failed')),
      };

      interceptor.intercept(context, next).subscribe({
        error: () => {
          setTimeout(() => {
            expect(usageTrackingService.trackApiCall).toHaveBeenCalled();
            done();
          }, 10);
        },
      });
    });
  });
});


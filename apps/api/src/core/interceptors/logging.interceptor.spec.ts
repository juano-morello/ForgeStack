// Mock the telemetry logger module - must be before imports
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

// Mock OpenTelemetry
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getActiveSpan: jest.fn(() => ({
      spanContext: () => ({ traceId: 'test-trace-id' }),
    })),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockResponse: any;

  beforeEach(async () => {
    // Clear mock calls before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);

    // Mock request object
    mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
      id: 'test-request-id',
      user: { id: 'user-123' },
      headers: {
        'user-agent': 'test-agent',
      },
    };

    // Mock response object
    mockResponse = {
      statusCode: 200,
    };

    // Mock ExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // Mock CallHandler
    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('intercept', () => {
    it('should log request start and completion with duration', (done) => {
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: 'test' });
          // Verify request received log
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'test-request-id',
              method: 'GET',
              path: '/api/v1/test',
            }),
            'Request received',
          );
          // Verify request completed log
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'test-request-id',
              method: 'GET',
              path: '/api/v1/test',
              statusCode: 200,
            }),
            'Request completed',
          );
          done();
        },
      });
    });

    it('should pass through the response unchanged', (done) => {
      const responseData = { id: '123', name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: (value) => {
          expect(value).toBe(responseData);
          done();
        },
      });
    });

    it('should log with correct status code from response', (done) => {
      mockResponse.statusCode = 201;
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(of({ created: true }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              method: 'GET',
              path: '/api/v1/test',
              statusCode: 201,
            }),
            'Request completed',
          );
          done();
        },
      });
    });

    it('should log error with status code and duration', (done) => {
      const error = { status: 404, message: 'Not found' };
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'test-request-id',
              method: 'GET',
              path: '/api/v1/test',
              statusCode: 404,
              error: 'Not found',
            }),
            'Request failed',
          );
          done();
        },
      });
    });

    it('should log error with 500 status when error has no status', (done) => {
      const error = new Error('Something went wrong');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
              requestId: 'test-request-id',
              method: 'GET',
              path: '/api/v1/test',
              statusCode: 500,
              error: 'Something went wrong',
            }),
            'Request failed',
          );
          done();
        },
      });
    });

    it('should handle requests without user', (done) => {
      mockRequest.user = undefined;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe({
        next: () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              method: 'GET',
              path: '/api/v1/test',
              statusCode: 200,
            }),
            'Request completed',
          );
          done();
        },
      });
    });
  });
});


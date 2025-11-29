import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);

    // Mock request object
    mockRequest = {
      method: 'GET',
      url: '/api/v1/test',
      user: { id: 'user-123' },
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
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: (value) => {
          expect(value).toEqual({ data: 'test' });
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/v1\/test 200 - \d+ms/),
          );
          done();
        },
      });
    });

    it('should pass through the response unchanged', (done) => {
      const responseData = { id: '123', name: 'Test' };
      mockCallHandler.handle = jest.fn().mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: (value) => {
          expect(value).toBe(responseData);
          done();
        },
      });
    });

    it('should log with correct status code from response', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockResponse.statusCode = 201;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ created: true }));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/v1\/test 201 - \d+ms/),
          );
          done();
        },
      });
    });

    it('should log error with status code and duration', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      const error = { status: 404, message: 'Not found' };
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/v1\/test 404 - \d+ms/),
          );
          done();
        },
      });
    });

    it('should log error with 500 status when error has no status', (done) => {
      const warnSpy = jest.spyOn(interceptor['logger'], 'warn');
      const error = new Error('Something went wrong');
      mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        error: () => {
          expect(warnSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/v1\/test 500 - \d+ms/),
          );
          done();
        },
      });
    });

    it('should handle requests without user', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.user = undefined;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringMatching(/GET \/api\/v1\/test 200 - \d+ms/),
          );
          done();
        },
      });
    });
  });
});


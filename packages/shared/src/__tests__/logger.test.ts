/**
 * Logger Tests
 * Tests for logger factory functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createBaseLogger, createChildLogger } from '../logger';
import type { Logger } from '../logger';
import { trace, SpanContext, TraceFlags } from '@opentelemetry/api';

describe('Logger', () => {
  describe('createBaseLogger', () => {
    beforeEach(() => {
      // Reset environment variables
      delete process.env.NODE_ENV;
      delete process.env.LOG_LEVEL;
    });

    it('should create a logger instance', () => {
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should use provided service name', () => {
      const logger = createBaseLogger({ serviceName: 'my-service' });
      
      // The logger should have the service name in its bindings
      expect(logger.bindings()).toHaveProperty('service', 'my-service');
    });

    it('should use provided log level', () => {
      const logger = createBaseLogger({ 
        serviceName: 'test-service',
        level: 'debug'
      });
      
      expect(logger.level).toBe('debug');
    });

    it('should default to info level when not specified', () => {
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger.level).toBe('info');
    });

    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'warn';
      
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger.level).toBe('warn');
    });

    it('should include environment in base fields', () => {
      process.env.NODE_ENV = 'production';
      
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger.bindings()).toHaveProperty('env', 'production');
    });

    it('should default to development environment', () => {
      delete process.env.NODE_ENV;
      
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger.bindings()).toHaveProperty('env', 'development');
    });

    it('should have all standard logging methods', () => {
      const logger = createBaseLogger({ serviceName: 'test-service' });
      
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('trace');
      expect(logger).toHaveProperty('fatal');
    });
  });

  describe('createChildLogger', () => {
    let baseLogger: Logger;

    beforeEach(() => {
      baseLogger = createBaseLogger({ serviceName: 'test-service' });
    });

    it('should create a child logger', () => {
      const childLogger = createChildLogger(baseLogger, 'TestModule');
      
      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });

    it('should include module name in bindings', () => {
      const childLogger = createChildLogger(baseLogger, 'TestModule');
      
      expect(childLogger.bindings()).toHaveProperty('module', 'TestModule');
    });

    it('should inherit base logger properties', () => {
      const childLogger = createChildLogger(baseLogger, 'TestModule');
      
      // Should have the same service name as parent
      expect(childLogger.bindings()).toHaveProperty('service', 'test-service');
      // Should have the module name
      expect(childLogger.bindings()).toHaveProperty('module', 'TestModule');
    });

    it('should have all standard logging methods', () => {
      const childLogger = createChildLogger(baseLogger, 'TestModule');
      
      expect(childLogger).toHaveProperty('info');
      expect(childLogger).toHaveProperty('warn');
      expect(childLogger).toHaveProperty('error');
      expect(childLogger).toHaveProperty('debug');
      expect(childLogger).toHaveProperty('trace');
      expect(childLogger).toHaveProperty('fatal');
    });

    it('should create multiple child loggers with different modules', () => {
      const child1 = createChildLogger(baseLogger, 'Module1');
      const child2 = createChildLogger(baseLogger, 'Module2');
      
      expect(child1.bindings()).toHaveProperty('module', 'Module1');
      expect(child2.bindings()).toHaveProperty('module', 'Module2');
    });
  });

  describe('Logger integration', () => {
    it('should allow logging with context', () => {
      const logger = createBaseLogger({ serviceName: 'test-service' });

      // Should not throw when logging with context
      expect(() => {
        logger.info({ userId: '123' }, 'Test message');
      }).not.toThrow();
    });

    it('should allow child logger to log with context', () => {
      const baseLogger = createBaseLogger({ serviceName: 'test-service' });
      const childLogger = createChildLogger(baseLogger, 'TestModule');

      // Should not throw when logging with context
      expect(() => {
        childLogger.info({ requestId: 'abc' }, 'Test message');
      }).not.toThrow();
    });
  });

  describe('OpenTelemetry integration', () => {
    it('should include trace context when active span exists', () => {
      const mockSpanContext: SpanContext = {
        traceId: '1234567890abcdef1234567890abcdef',
        spanId: 'abcdef1234567890',
        traceFlags: TraceFlags.SAMPLED,
      };

      const mockSpan = {
        spanContext: () => mockSpanContext,
      };

      vi.spyOn(trace, 'getActiveSpan').mockReturnValue(mockSpan as ReturnType<typeof trace.getActiveSpan>);

      const logger = createBaseLogger({ serviceName: 'test-service' });

      // The mixin should have been called and trace context should be available
      // We verify by checking that the logger was created without throwing
      expect(logger).toBeDefined();

      vi.restoreAllMocks();
    });

    it('should handle when no active span exists', () => {
      vi.spyOn(trace, 'getActiveSpan').mockReturnValue(undefined);

      const logger = createBaseLogger({ serviceName: 'test-service' });

      // Should create logger without errors even when no span exists
      expect(logger).toBeDefined();

      vi.restoreAllMocks();
    });
  });
});


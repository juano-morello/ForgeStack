/**
 * Tests for TelemetryService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TelemetryService } from './telemetry.service';

describe('TelemetryService', () => {
  let service: TelemetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TelemetryService],
    }).compile();

    service = module.get<TelemetryService>(TelemetryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('withSpan', () => {
    it('should execute function and return result', async () => {
      const result = await service.withSpan('test-span', async () => {
        return 'test-result';
      });

      expect(result).toBe('test-result');
    });

    it('should propagate errors', async () => {
      await expect(
        service.withSpan('test-span', async () => {
          throw new Error('test error');
        }),
      ).rejects.toThrow('test error');
    });
  });

  describe('getTraceId', () => {
    it('should return undefined when no active span', () => {
      const traceId = service.getTraceId();
      expect(traceId).toBeUndefined();
    });
  });

  describe('getSpanId', () => {
    it('should return undefined when no active span', () => {
      const spanId = service.getSpanId();
      expect(spanId).toBeUndefined();
    });
  });

  describe('addSpanAttributes', () => {
    it('should not throw when no active span', () => {
      expect(() => {
        service.addSpanAttributes({ key: 'value' });
      }).not.toThrow();
    });
  });

  describe('recordException', () => {
    it('should not throw when no active span', () => {
      expect(() => {
        service.recordException(new Error('test'));
      }).not.toThrow();
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return status ok', () => {
      const result = controller.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.check();

      // Verify timestamp is a valid ISO date string
      const parsedDate = new Date(result.timestamp);
      expect(parsedDate.toISOString()).toBe(result.timestamp);
    });
  });
});


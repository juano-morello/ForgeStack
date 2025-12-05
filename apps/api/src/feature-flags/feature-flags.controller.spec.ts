import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsController } from './feature-flags.controller';
import { FeatureFlagsService } from './feature-flags.service';
import { createMockTenantContext } from '../../test/test-utils';

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('FeatureFlagsController', () => {
  let controller: FeatureFlagsController;
  let service: jest.Mocked<FeatureFlagsService>;
  let ctx: TenantContext;

  beforeEach(async () => {
    const mockService = {
      isEnabled: jest.fn(),
      getFeaturesWithStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagsController],
      providers: [
        {
          provide: FeatureFlagsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<FeatureFlagsController>(FeatureFlagsController);
    service = module.get(FeatureFlagsService);
    ctx = createMockTenantContext({ role: 'OWNER' }) as TenantContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listFeatures', () => {
    it('should return list of features with status', async () => {
      const mockFeatures = [
        {
          key: 'advanced-analytics',
          name: 'Advanced Analytics',
          description: 'Access to advanced analytics',
          enabled: true,
        },
        {
          key: 'api-access',
          name: 'API Access',
          description: 'Access to REST API',
          enabled: false,
          requiredPlan: 'pro',
        },
      ];

      service.getFeaturesWithStatus.mockResolvedValue(mockFeatures);

      const result = await controller.listFeatures(ctx);

      expect(result).toEqual(mockFeatures);
      expect(service.getFeaturesWithStatus).toHaveBeenCalledWith(ctx);
    });
  });

  describe('checkFeature', () => {
    it('should return enabled status for a feature', async () => {
      service.isEnabled.mockResolvedValue(true);

      const result = await controller.checkFeature('advanced-analytics', ctx);

      expect(result).toEqual({
        key: 'advanced-analytics',
        enabled: true,
      });
      expect(service.isEnabled).toHaveBeenCalledWith(ctx, 'advanced-analytics');
    });

    it('should return disabled status for a feature', async () => {
      service.isEnabled.mockResolvedValue(false);

      const result = await controller.checkFeature('api-access', ctx);

      expect(result).toEqual({
        key: 'api-access',
        enabled: false,
      });
      expect(service.isEnabled).toHaveBeenCalledWith(ctx, 'api-access');
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsRepository } from './feature-flags.repository';
import { createMockTenantContext, mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  eq: jest.fn(),
  subscriptions: {},
}));

import type { OrgRole } from '@forgestack/shared';

interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let repository: jest.Mocked<FeatureFlagsRepository>;
  let ctx: TenantContext;

  beforeEach(async () => {
    const mockRepository = {
      findAll: jest.fn(),
      findByKey: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findOverridesByOrgId: jest.fn(),
      findOverride: jest.fn(),
      createOverride: jest.fn(),
      updateOverride: jest.fn(),
      deleteOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: FeatureFlagsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    repository = module.get(FeatureFlagsRepository);
    ctx = createMockTenantContext({ role: 'OWNER' }) as TenantContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isEnabled', () => {
    it('should return false for non-existent flag', async () => {
      repository.findByKey.mockResolvedValue(null);

      const result = await service.isEnabled(ctx, 'non-existent');

      expect(result).toBe(false);
      expect(repository.findByKey).toHaveBeenCalledWith('non-existent');
    });

    it('should return false when master switch is off', async () => {
      repository.findByKey.mockResolvedValue({
        id: mockUUID(),
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'boolean',
        defaultValue: true,
        plans: null,
        percentage: null,
        enabled: false, // Master switch off
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.isEnabled(ctx, 'test-flag');

      expect(result).toBe(false);
    });

    it('should return override value when exists', async () => {
      const flagId = mockUUID();
      repository.findByKey.mockResolvedValue({
        id: flagId,
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'boolean',
        defaultValue: false,
        plans: null,
        percentage: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findOverride.mockResolvedValue({
        id: mockUUID(),
        orgId: ctx.orgId,
        flagId,
        enabled: true, // Override to true
        reason: 'Beta tester',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.isEnabled(ctx, 'test-flag');

      expect(result).toBe(true);
      expect(repository.findOverride).toHaveBeenCalledWith(ctx.orgId, flagId);
    });

    it('should evaluate boolean flag correctly', async () => {
      repository.findByKey.mockResolvedValue({
        id: mockUUID(),
        key: 'test-flag',
        name: 'Test Flag',
        description: null,
        type: 'boolean',
        defaultValue: true,
        plans: null,
        percentage: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      repository.findOverride.mockResolvedValue(null);

      const result = await service.isEnabled(ctx, 'test-flag');

      expect(result).toBe(true);
    });
  });

  describe('create', () => {
    it('should create a new flag', async () => {
      const dto = {
        key: 'new-flag',
        name: 'New Flag',
        type: 'boolean' as const,
      };

      repository.findByKey.mockResolvedValue(null);
      repository.create.mockResolvedValue({
        id: mockUUID(),
        ...dto,
        description: null,
        defaultValue: false,
        plans: null,
        percentage: null,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(repository.create).toHaveBeenCalled();
    });
  });
});


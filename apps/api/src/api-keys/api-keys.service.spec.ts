/**
 * API Keys Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysRepository } from './api-keys.repository';
import * as keyUtils from './key-utils';

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
  apiKeys: {},
}));

// Mock key utilities
jest.mock('./key-utils', () => ({
  ...jest.requireActual('./key-utils'),
  generateApiKey: jest.fn(),
  hashApiKey: jest.fn(),
  extractKeyPrefix: jest.fn(),
  validateScopes: jest.fn(),
}));

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let repository: jest.Mocked<ApiKeysRepository>;

  const mockTenantContext = {
    orgId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    role: 'OWNER' as const,
  };

  const mockApiKey = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    orgId: mockTenantContext.orgId,
    name: 'Test Key',
    keyPrefix: 'fsk_live_abc',
    keyHash: 'hash123',
    scopes: ['projects:read'],
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdBy: mockTenantContext.userId,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByKeyHash: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      revoke: jest.fn(),
      updateLastUsed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        {
          provide: ApiKeysRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ApiKeysService>(ApiKeysService);
    repository = module.get(ApiKeysRepository);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('createKey', () => {
    it('should create and return a new API key with full key', async () => {
      const dto = {
        name: 'Test Key',
        scopes: ['projects:read'],
      };

      const plainKey = 'fsk_live_abcdefghijklmnopqrstuvwxyz123456';
      (keyUtils.validateScopes as jest.Mock).mockReturnValue(true);
      (keyUtils.generateApiKey as jest.Mock).mockReturnValue(plainKey);
      (keyUtils.hashApiKey as jest.Mock).mockReturnValue('hash123');
      (keyUtils.extractKeyPrefix as jest.Mock).mockReturnValue('fsk_live_abc');

      repository.create.mockResolvedValue(mockApiKey);

      const result = await service.createKey(mockTenantContext, dto);

      expect(result).toHaveProperty('key', plainKey);
      expect(result).toHaveProperty('id', mockApiKey.id);
      expect(result).toHaveProperty('name', mockApiKey.name);
      expect(keyUtils.validateScopes).toHaveBeenCalledWith(dto.scopes);
      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid scopes', async () => {
      const dto = {
        name: 'Test Key',
        scopes: ['invalid:scope'],
      };

      (keyUtils.validateScopes as jest.Mock).mockReturnValue(false);

      await expect(service.createKey(mockTenantContext, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listKeys', () => {
    it('should return list of API keys without hashes', async () => {
      repository.findAll.mockResolvedValue([mockApiKey]);

      const result = await service.listKeys(mockTenantContext);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result.data[0]).not.toHaveProperty('keyHash');
      expect(result.data[0]).toHaveProperty('keyPrefix');
    });
  });

  describe('getKey', () => {
    it('should return a single API key', async () => {
      repository.findById.mockResolvedValue(mockApiKey);

      const result = await service.getKey(mockTenantContext, mockApiKey.id);

      expect(result).toHaveProperty('id', mockApiKey.id);
      expect(result).not.toHaveProperty('keyHash');
    });

    it('should throw NotFoundException if key not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.getKey(mockTenantContext, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateKey', () => {
    it('should update and return the API key', async () => {
      const dto = { name: 'Updated Key' };
      const updatedKey = { ...mockApiKey, name: 'Updated Key' };

      repository.update.mockResolvedValue(updatedKey);

      const result = await service.updateKey(mockTenantContext, mockApiKey.id, dto);

      expect(result).toHaveProperty('name', 'Updated Key');
      expect(repository.update).toHaveBeenCalledWith(mockTenantContext, mockApiKey.id, dto);
    });
  });
});


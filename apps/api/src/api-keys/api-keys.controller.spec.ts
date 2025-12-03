/**
 * API Keys Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  isNull: jest.fn(),
  withTenantContext: jest.fn(),
  withServiceContext: jest.fn(),
  apiKeys: {},
}));

describe('ApiKeysController', () => {
  let controller: ApiKeysController;
  let service: jest.Mocked<ApiKeysService>;

  const ownerContext = {
    orgId: '550e8400-e29b-41d4-a716-446655440000',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    role: 'OWNER' as const,
  };

  const memberContext = {
    ...ownerContext,
    role: 'MEMBER' as const,
  };

  const mockApiKeyDto = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    name: 'Test Key',
    keyPrefix: 'fsk_live_abc',
    scopes: ['projects:read'],
    lastUsedAt: null,
    expiresAt: null,
    revokedAt: null,
    createdAt: '2024-01-01T00:00:00.000Z',
    isRevoked: false,
  };

  beforeEach(async () => {
    const mockService = {
      createKey: jest.fn(),
      listKeys: jest.fn(),
      getKey: jest.fn(),
      updateKey: jest.fn(),
      revokeKey: jest.fn(),
      rotateKey: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ApiKeysController>(ApiKeysController);
    service = module.get(ApiKeysService);
  });

  describe('create', () => {
    it('should create an API key when user is OWNER', async () => {
      const dto = { name: 'Test Key', scopes: ['projects:read'] };
      const mockCreatedKey = { ...mockApiKeyDto, key: 'fsk_live_full_key' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      service.createKey.mockResolvedValue(mockCreatedKey as any);

      const result = await controller.create(ownerContext, dto);

      expect(result).toEqual(mockCreatedKey);
      expect(service.createKey).toHaveBeenCalledWith(ownerContext, dto);
    });

    it('should throw ForbiddenException when user is MEMBER', async () => {
      const dto = { name: 'Test Key', scopes: ['projects:read'] };

      await expect(controller.create(memberContext, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.createKey).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should list API keys when user is OWNER', async () => {
      const mockList = { data: [mockApiKeyDto], total: 1 };
      service.listKeys.mockResolvedValue(mockList);

      const result = await controller.findAll(ownerContext);

      expect(result).toEqual(mockList);
      expect(service.listKeys).toHaveBeenCalledWith(ownerContext);
    });

    it('should throw ForbiddenException when user is MEMBER', async () => {
      await expect(controller.findAll(memberContext)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.listKeys).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should get an API key when user is OWNER', async () => {
      service.getKey.mockResolvedValue(mockApiKeyDto);

      const result = await controller.findOne(ownerContext, mockApiKeyDto.id);

      expect(result).toEqual(mockApiKeyDto);
      expect(service.getKey).toHaveBeenCalledWith(ownerContext, mockApiKeyDto.id);
    });

    it('should throw ForbiddenException when user is MEMBER', async () => {
      await expect(controller.findOne(memberContext, mockApiKeyDto.id)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.getKey).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an API key when user is OWNER', async () => {
      const dto = { name: 'Updated Key' };
      const updatedKey = { ...mockApiKeyDto, name: 'Updated Key' };
      service.updateKey.mockResolvedValue(updatedKey);

      const result = await controller.update(ownerContext, mockApiKeyDto.id, dto);

      expect(result).toEqual(updatedKey);
      expect(service.updateKey).toHaveBeenCalledWith(ownerContext, mockApiKeyDto.id, dto);
    });

    it('should throw ForbiddenException when user is MEMBER', async () => {
      const dto = { name: 'Updated Key' };

      await expect(controller.update(memberContext, mockApiKeyDto.id, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(service.updateKey).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('should revoke an API key when user is OWNER', async () => {
      const mockResponse = { message: 'API key has been revoked', revokedAt: '2024-01-01T00:00:00.000Z' };
      service.revokeKey.mockResolvedValue(mockResponse);

      const result = await controller.revoke(ownerContext, mockApiKeyDto.id);

      expect(result).toEqual(mockResponse);
      expect(service.revokeKey).toHaveBeenCalledWith(ownerContext, mockApiKeyDto.id);
    });
  });
});


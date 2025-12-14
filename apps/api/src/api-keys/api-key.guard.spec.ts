/**
 * API Key Guard Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyGuard } from './api-key.guard';
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

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let service: jest.Mocked<ApiKeysService>;
  let reflector: jest.Mocked<Reflector>;

  const mockKeyData = {
    id: '770e8400-e29b-41d4-a716-446655440002',
    orgId: '550e8400-e29b-41d4-a716-446655440000',
    createdBy: '660e8400-e29b-41d4-a716-446655440001',
    scopes: ['projects:read'],
  };

  beforeEach(async () => {
    const mockService = {
      validateKey: jest.fn(),
    };

    const mockReflector = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyGuard,
        {
          provide: ApiKeysService,
          useValue: mockService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<ApiKeyGuard>(ApiKeyGuard);
    service = module.get(ApiKeysService);
    reflector = module.get(Reflector);
  });

  const createMockExecutionContext = (headers: Record<string, string>): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
      getHandler: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  };

  describe('canActivate', () => {
    it('should allow request with valid API key in X-API-Key header', async () => {
      const context = createMockExecutionContext({
        'x-api-key': 'fsk_live_validkey123456789012345678',
      });

      service.validateKey.mockResolvedValue(mockKeyData);
      reflector.get.mockReturnValue([]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(service.validateKey).toHaveBeenCalled();
    });

    it('should allow request with valid API key in Authorization header', async () => {
      const context = createMockExecutionContext({
        authorization: 'Bearer fsk_live_validkey123456789012345678',
      });

      service.validateKey.mockResolvedValue(mockKeyData);
      reflector.get.mockReturnValue([]);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(service.validateKey).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no API key is provided', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when API key is invalid', async () => {
      const context = createMockExecutionContext({
        'x-api-key': 'fsk_live_invalidkey123456789012345678',
      });

      service.validateKey.mockResolvedValue(null);

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when required scope is missing', async () => {
      const context = createMockExecutionContext({
        'x-api-key': 'fsk_live_validkey123456789012345678',
      });

      service.validateKey.mockResolvedValue(mockKeyData);
      reflector.get.mockReturnValue(['projects:write']); // Key only has projects:read

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it('should allow request when key has wildcard scope', async () => {
      const context = createMockExecutionContext({
        'x-api-key': 'fsk_live_validkey123456789012345678',
      });

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['*'],
      });
      reflector.get.mockReturnValue(['projects:write']);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should set tenant context with MEMBER role for limited scopes', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['projects:read', 'files:read'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'MEMBER',
      });
    });

    it('should set tenant context with OWNER role for wildcard scope', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['*'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'OWNER',
      });
    });

    it('should set tenant context with OWNER role for members:write scope', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['members:write'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'OWNER',
      });
    });

    it('should set tenant context with OWNER role for billing:write scope', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['billing:write'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'OWNER',
      });
    });

    it('should set tenant context with OWNER role for api-keys:write scope', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['api-keys:write'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'OWNER',
      });
    });

    it('should set tenant context with MEMBER role for projects:write scope', async () => {
      const mockRequest = { headers: { 'x-api-key': 'fsk_live_validkey123456789012345678' } };
      const context = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      service.validateKey.mockResolvedValue({
        ...mockKeyData,
        scopes: ['projects:write'],
      });
      reflector.get.mockReturnValue([]);

      await guard.canActivate(context);

      expect(mockRequest).toHaveProperty('tenantContext');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((mockRequest as any).tenantContext).toEqual({
        orgId: mockKeyData.orgId,
        userId: mockKeyData.createdBy,
        role: 'MEMBER',
      });
    });
  });
});


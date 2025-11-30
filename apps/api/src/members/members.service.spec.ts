import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersRepository } from './members.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { createMockTenantContext, mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  organizations: {},
  organizationMembers: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('MembersService', () => {
  let service: MembersService;
  let repository: jest.Mocked<MembersRepository>;

  const createMockMember = (overrides: Record<string, unknown> = {}) => ({
    userId: mockUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'MEMBER' as const,
    joinedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      findAllByOrgId: jest.fn(),
      findByUserIdAndOrgId: jest.fn(),
      create: jest.fn(),
      updateRole: jest.fn(),
      delete: jest.fn(),
      countOwners: jest.fn(),
    };

    const mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const mockNotificationsService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembersService,
        {
          provide: MembersRepository,
          useValue: mockRepository,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<MembersService>(MembersService);
    repository = module.get(MembersRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated members', async () => {
      const ctx = createMockTenantContext();
      const query = { page: 1, limit: 10 };
      const mockResult = {
        items: [createMockMember()],
        total: 1,
        page: 1,
        limit: 10,
      };

      repository.findAllByOrgId.mockResolvedValueOnce(mockResult);

      const result = await service.findAll(ctx, query);

      expect(result).toEqual(mockResult);
      expect(repository.findAllByOrgId).toHaveBeenCalledWith(ctx.orgId, {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('updateRole', () => {
    it('should update role for valid OWNER caller', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const dto = { role: 'OWNER' as const };
      const mockMember = createMockMember({ userId: targetUserId, role: 'MEMBER' });
      const updatedMember = { ...mockMember, role: 'OWNER' as const };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.updateRole.mockResolvedValueOnce();
      repository.findByUserIdAndOrgId.mockResolvedValueOnce(updatedMember);

      const result = await service.updateRole(ctx, targetUserId, dto);

      expect(result).toEqual(updatedMember);
      expect(repository.updateRole).toHaveBeenCalledWith(ctx.orgId, targetUserId, dto.role);
    });

    it('should throw ForbiddenException if caller is not OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'MEMBER' });
      const targetUserId = mockUUID();
      const dto = { role: 'OWNER' as const };

      await expect(service.updateRole(ctx, targetUserId, dto)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.findByUserIdAndOrgId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if target member not found', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const dto = { role: 'OWNER' as const };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(null);

      await expect(service.updateRole(ctx, targetUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if trying to demote last OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const dto = { role: 'MEMBER' as const };
      const mockMember = createMockMember({ userId: targetUserId, role: 'OWNER' });

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.countOwners.mockResolvedValueOnce(1);

      await expect(service.updateRole(ctx, targetUserId, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.updateRole).not.toHaveBeenCalled();
    });

    it('should allow demoting OWNER when there are multiple owners', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const dto = { role: 'MEMBER' as const };
      const mockMember = createMockMember({ userId: targetUserId, role: 'OWNER' });
      const updatedMember = { ...mockMember, role: 'MEMBER' as const };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.countOwners.mockResolvedValueOnce(2);
      repository.updateRole.mockResolvedValueOnce();
      repository.findByUserIdAndOrgId.mockResolvedValueOnce(updatedMember);

      const result = await service.updateRole(ctx, targetUserId, dto);

      expect(result).toEqual(updatedMember);
    });

    it('should throw BadRequestException if trying to demote self as last OWNER', async () => {
      const userId = mockUUID();
      const ctx = createMockTenantContext({ role: 'OWNER', userId });
      const dto = { role: 'MEMBER' as const };
      const mockMember = createMockMember({ userId, role: 'OWNER' });

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.countOwners.mockResolvedValueOnce(1);

      await expect(service.updateRole(ctx, userId, dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.updateRole).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove member for valid OWNER caller', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const mockMember = createMockMember({ userId: targetUserId, role: 'MEMBER' });
      const mockOrg = { id: ctx.orgId, ownerUserId: mockUUID() };
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockOrg]),
      };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.delete.mockResolvedValueOnce();
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await service.remove(ctx, targetUserId);

      expect(repository.delete).toHaveBeenCalledWith(ctx.orgId, targetUserId);
    });

    it('should throw ForbiddenException if caller is not OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'MEMBER' });
      const targetUserId = mockUUID();

      await expect(service.remove(ctx, targetUserId)).rejects.toThrow(
        ForbiddenException,
      );
      expect(repository.findByUserIdAndOrgId).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if target member not found', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(null);

      await expect(service.remove(ctx, targetUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if trying to remove last OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER', userId: mockUUID() });
      const targetUserId = ctx.userId;
      const mockMember = createMockMember({ userId: targetUserId, role: 'OWNER' });

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.countOwners.mockResolvedValueOnce(1);

      await expect(service.remove(ctx, targetUserId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if trying to remove founding owner', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const foundingOwnerId = mockUUID();
      const mockMember = createMockMember({ userId: foundingOwnerId, role: 'OWNER' });
      const mockOrg = { id: ctx.orgId, ownerUserId: foundingOwnerId };
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockOrg]),
      };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await expect(service.remove(ctx, foundingOwnerId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should allow removing non-founding OWNER when multiple owners exist', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const foundingOwnerId = mockUUID();
      const mockMember = createMockMember({ userId: targetUserId, role: 'OWNER' });
      const mockOrg = { id: ctx.orgId, ownerUserId: foundingOwnerId };
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockOrg]),
      };

      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      repository.delete.mockResolvedValueOnce();
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await service.remove(ctx, targetUserId);

      expect(repository.delete).toHaveBeenCalledWith(ctx.orgId, targetUserId);
    });

    it('should throw NotFoundException if organization not found during remove', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const targetUserId = mockUUID();
      const mockMember = createMockMember({ userId: targetUserId, role: 'MEMBER' });
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([]), // Empty array = org not found
      };

      // First call
      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      await expect(service.remove(ctx, targetUserId)).rejects.toThrow(NotFoundException);

      // Second call for the second expect
      repository.findByUserIdAndOrgId.mockResolvedValueOnce(mockMember);
      mockTx.limit.mockResolvedValueOnce([]); // Reset for second call

      await expect(service.remove(ctx, targetUserId)).rejects.toThrow('Organization not found');
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('addMember', () => {
    it('should add member to organization', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const role = 'MEMBER' as const;

      repository.create.mockResolvedValueOnce();

      await service.addMember(orgId, userId, role);

      expect(repository.create).toHaveBeenCalledWith(orgId, userId, role);
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { ActivitiesService } from '../activities/activities.service';
import {
  createMockInvitation,
  createMockOrganization,
  createMockTenantContext,
  mockUUID,
} from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  organizationMembers: {},
  organizations: {},
  users: {},
  invitations: {},
}));

// Mock the repository modules
jest.mock('./invitations.repository', () => ({
  InvitationsRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findByOrgId: jest.fn(),
    findById: jest.fn(),
    findByToken: jest.fn(),
    findByEmailAndOrg: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock('../organizations/organizations.repository', () => ({
  OrganizationsRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn(),
    findMembership: jest.fn(),
  })),
}));

jest.mock('../queue/queue.service', () => ({
  QueueService: jest.fn().mockImplementation(() => ({
    addJob: jest.fn(),
  })),
}));

import { InvitationsRepository } from './invitations.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { QueueService } from '../queue/queue.service';
import { withServiceContext } from '@forgestack/db';

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationsRepository: jest.Mocked<InvitationsRepository>;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let queueService: jest.Mocked<QueueService>;

  beforeEach(async () => {
    const mockInvitationsRepository = {
      create: jest.fn(),
      findByOrgId: jest.fn(),
      findById: jest.fn(),
      findByToken: jest.fn(),
      findByEmailAndOrg: jest.fn(),
      delete: jest.fn(),
    };

    const mockOrganizationsRepository = {
      findById: jest.fn(),
      findMembership: jest.fn(),
    };

    const mockQueueService = {
      addJob: jest.fn(),
    };

    const mockActivitiesService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: InvitationsRepository,
          useValue: mockInvitationsRepository,
        },
        {
          provide: OrganizationsRepository,
          useValue: mockOrganizationsRepository,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: ActivitiesService,
          useValue: mockActivitiesService,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    invitationsRepository = module.get(InvitationsRepository);
    organizationsRepository = module.get(OrganizationsRepository);
    queueService = module.get(QueueService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create invitation for valid OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const dto = { email: 'newuser@example.com', role: 'MEMBER' as const };
      const mockInvitation = createMockInvitation({
        orgId: ctx.orgId,
        email: dto.email,
        role: dto.role,
      });
      const mockOrg = createMockOrganization({ id: ctx.orgId, name: 'Test Org' });

      // Mock the transaction callback to execute it
      const mockTx = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };

      // First call returns empty array (no user found)
      mockTx.select.mockReturnValueOnce(mockTx);
      mockTx.from.mockReturnValueOnce(mockTx);
      mockTx.where.mockResolvedValueOnce([]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      // Mock no existing invitation
      invitationsRepository.findByEmailAndOrg.mockResolvedValueOnce(null);
      // Mock invitation creation
      invitationsRepository.create.mockResolvedValueOnce(mockInvitation);
      // Mock organization lookup
      organizationsRepository.findById.mockResolvedValueOnce(mockOrg);
      // Mock queue job
      queueService.addJob.mockResolvedValueOnce(undefined);

      const result = await service.create(ctx, dto);

      expect(result).toEqual(mockInvitation);
      expect(invitationsRepository.create).toHaveBeenCalledWith(
        ctx.orgId,
        dto.email,
        dto.role,
        expect.any(String), // token
        expect.any(Date), // expiresAt
      );
      expect(queueService.addJob).toHaveBeenCalledWith('send-invitation', {
        invitationId: mockInvitation.id,
        email: mockInvitation.email,
        orgName: mockOrg.name,
        role: mockInvitation.role,
        token: mockInvitation.token,
      });
    });

    it('should throw if user already a member', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const dto = { email: 'existing@example.com', role: 'MEMBER' as const };
      const userId = mockUUID();

      // Mock the transaction callback to execute it and return existing member
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        const mockTx = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn(),
        };

        // First call returns user
        mockTx.where.mockResolvedValueOnce([{ id: userId }]);

        // Second call returns member
        mockTx.where.mockResolvedValueOnce([{ userId, orgId: ctx.orgId }]);

        return callback(mockTx);
      });

      await expect(service.create(ctx, dto)).rejects.toThrow(ConflictException);
    });

    it('should throw if pending invitation exists', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const dto = { email: 'pending@example.com', role: 'MEMBER' as const };
      const mockInvitation = createMockInvitation({ email: dto.email });

      // Mock no existing member
      (withServiceContext as jest.Mock).mockResolvedValueOnce(null);
      // Mock existing invitation
      invitationsRepository.findByEmailAndOrg.mockResolvedValueOnce(mockInvitation);

      await expect(service.create(ctx, dto)).rejects.toThrow(ConflictException);
    });

    it('should throw if caller is not OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'MEMBER' });
      const dto = { email: 'test@example.com', role: 'MEMBER' as const };

      await expect(service.create(ctx, dto)).rejects.toThrow(ForbiddenException);
      await expect(service.create(ctx, dto)).rejects.toThrow('Only owners can invite members');
    });

    it('should throw if organization lookup fails after creating invitation', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const dto = { email: 'newuser@example.com', role: 'MEMBER' as const };
      const mockInvitation = createMockInvitation({
        orgId: ctx.orgId,
        email: dto.email,
        role: dto.role,
      });

      // Mock the transaction callback to execute it
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        const mockTx = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn(),
        };

        // First call returns empty array (no user found)
        mockTx.where.mockResolvedValueOnce([]);

        return callback(mockTx);
      });

      // Mock no existing invitation
      invitationsRepository.findByEmailAndOrg.mockResolvedValueOnce(null);
      // Mock invitation creation
      invitationsRepository.create.mockResolvedValueOnce(mockInvitation);
      // Mock organization lookup failure
      organizationsRepository.findById.mockResolvedValueOnce(null);

      await expect(service.create(ctx, dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(ctx, dto)).rejects.toThrow('Organization not found');
    });

    it('should handle queue service failure gracefully', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const dto = { email: 'newuser@example.com', role: 'MEMBER' as const };
      const mockInvitation = createMockInvitation({
        orgId: ctx.orgId,
        email: dto.email,
        role: dto.role,
      });
      const mockOrg = createMockOrganization({ id: ctx.orgId, name: 'Test Org' });

      // Mock no existing member
      (withServiceContext as jest.Mock).mockResolvedValueOnce(null);
      // Mock no existing invitation
      invitationsRepository.findByEmailAndOrg.mockResolvedValueOnce(null);
      // Mock invitation creation
      invitationsRepository.create.mockResolvedValueOnce(mockInvitation);
      // Mock organization lookup
      organizationsRepository.findById.mockResolvedValueOnce(mockOrg);
      // Mock queue job failure
      queueService.addJob.mockRejectedValueOnce(new Error('Queue service unavailable'));

      await expect(service.create(ctx, dto)).rejects.toThrow('Queue service unavailable');
    });
  });

  describe('findAllForOrg', () => {
    it('should return paginated invitations for OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const query = { page: 1, limit: 10 };
      const mockInvitations = {
        items: [createMockInvitation()],
        total: 1,
        page: 1,
        limit: 10,
      };

      invitationsRepository.findByOrgId.mockResolvedValueOnce(mockInvitations);

      const result = await service.findAllForOrg(ctx, query);

      expect(result).toEqual(mockInvitations);
      expect(invitationsRepository.findByOrgId).toHaveBeenCalledWith(ctx.orgId, {
        page: query.page,
        limit: query.limit,
      });
    });

    it('should throw if caller is not OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'MEMBER' });
      const query = { page: 1, limit: 10 };

      await expect(service.findAllForOrg(ctx, query)).rejects.toThrow(ForbiddenException);
      await expect(service.findAllForOrg(ctx, query)).rejects.toThrow(
        'Only owners can view invitations',
      );
    });
  });

  describe('cancel', () => {
    it('should cancel invitation for valid OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const invitationId = mockUUID();
      const mockInvitation = createMockInvitation({ id: invitationId, orgId: ctx.orgId });

      invitationsRepository.findById.mockResolvedValueOnce(mockInvitation);
      invitationsRepository.delete.mockResolvedValueOnce(true);

      const result = await service.cancel(ctx, invitationId);

      expect(result).toEqual({ deleted: true });
      expect(invitationsRepository.delete).toHaveBeenCalledWith(invitationId);
    });

    it('should throw if invitation not found', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER' });
      const invitationId = mockUUID();

      invitationsRepository.findById.mockResolvedValueOnce(null);

      await expect(service.cancel(ctx, invitationId)).rejects.toThrow(NotFoundException);
      await expect(service.cancel(ctx, invitationId)).rejects.toThrow('Invitation not found');
    });

    it('should throw if caller is not OWNER', async () => {
      const ctx = createMockTenantContext({ role: 'MEMBER' });
      const invitationId = mockUUID();

      await expect(service.cancel(ctx, invitationId)).rejects.toThrow(ForbiddenException);
      await expect(service.cancel(ctx, invitationId)).rejects.toThrow(
        'Only owners can cancel invitations',
      );
    });

    it('should throw if invitation belongs to different org', async () => {
      const ctx = createMockTenantContext({ role: 'OWNER', orgId: mockUUID() });
      const invitationId = mockUUID();
      const mockInvitation = createMockInvitation({ id: invitationId, orgId: mockUUID() });

      invitationsRepository.findById.mockResolvedValueOnce(mockInvitation);

      await expect(service.cancel(ctx, invitationId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('accept', () => {
    it('should accept invitation and add member', async () => {
      const userId = mockUUID();
      const userEmail = 'test@example.com';
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({ email: userEmail, token });
      const mockOrg = { id: mockInvitation.orgId, name: 'Test Org' };

      invitationsRepository.findByToken.mockResolvedValueOnce(mockInvitation);
      organizationsRepository.findMembership.mockResolvedValueOnce(null);

      // Mock the transaction callback to execute it
      const mockTx = {
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
      };

      mockTx.insert.mockReturnValueOnce(mockTx);
      mockTx.values.mockResolvedValueOnce(undefined);
      mockTx.delete.mockReturnValueOnce(mockTx);
      mockTx.where.mockResolvedValueOnce(undefined);
      mockTx.select.mockReturnValueOnce(mockTx);
      mockTx.from.mockReturnValueOnce(mockTx);
      mockTx.where.mockResolvedValueOnce([mockOrg]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await service.accept(userId, userEmail, token);

      expect(result).toEqual({ organization: mockOrg, role: mockInvitation.role });
      expect(withServiceContext).toHaveBeenCalledWith(
        'InvitationsService.accept',
        expect.any(Function),
      );
    });

    it('should throw if token not found', async () => {
      const userId = mockUUID();
      const userEmail = 'test@example.com';
      const token = 'invalid-token';

      invitationsRepository.findByToken.mockResolvedValueOnce(null);

      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(NotFoundException);
      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(
        'Invitation not found or expired',
      );
    });

    it('should throw if invitation expired', async () => {
      const userId = mockUUID();
      const userEmail = 'test@example.com';
      const token = 'a'.repeat(64);
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
      const mockInvitation = createMockInvitation({
        email: userEmail,
        token,
        expiresAt: expiredDate,
      });

      invitationsRepository.findByToken.mockResolvedValueOnce(mockInvitation);

      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(BadRequestException);
    });

    it("should throw if email doesn't match", async () => {
      const userId = mockUUID();
      const userEmail = 'user@example.com';
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({
        email: 'different@example.com',
        token,
      });

      invitationsRepository.findByToken.mockResolvedValueOnce(mockInvitation);

      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(ForbiddenException);
    });

    it('should throw if user is already a member', async () => {
      const userId = mockUUID();
      const userEmail = 'test@example.com';
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({ email: userEmail, token });

      invitationsRepository.findByToken.mockResolvedValueOnce(mockInvitation);
      organizationsRepository.findMembership.mockResolvedValueOnce({ role: 'MEMBER' });
      invitationsRepository.delete.mockResolvedValueOnce(true);

      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(ConflictException);
      expect(invitationsRepository.delete).toHaveBeenCalledWith(mockInvitation.id);
    });

    it('should throw if organization not found during accept transaction', async () => {
      const userId = mockUUID();
      const userEmail = 'test@example.com';
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({ email: userEmail, token });

      invitationsRepository.findByToken.mockResolvedValue(mockInvitation);
      organizationsRepository.findMembership.mockResolvedValue(null);

      // Mock the transaction callback to execute it
      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        const mockTx = {
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          delete: jest.fn().mockReturnThis(),
          where: jest.fn(),
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
        };

        mockTx.values.mockResolvedValue(undefined);
        mockTx.where.mockResolvedValueOnce(undefined);
        mockTx.where.mockResolvedValueOnce([]); // Empty array = org not found

        return callback(mockTx);
      });

      await expect(service.accept(userId, userEmail, token)).rejects.toThrow(NotFoundException);
      await expect(service.accept(userId, userEmail, token)).rejects.toThrow('Organization not found');
    });
  });

  describe('decline', () => {
    it('should delete invitation', async () => {
      const token = 'a'.repeat(64);
      const mockInvitation = createMockInvitation({ token });

      invitationsRepository.findByToken.mockResolvedValueOnce(mockInvitation);
      invitationsRepository.delete.mockResolvedValueOnce(true);

      const result = await service.decline(token);

      expect(result).toEqual({ deleted: true });
      expect(invitationsRepository.delete).toHaveBeenCalledWith(mockInvitation.id);
    });

    it('should throw if invitation not found', async () => {
      const token = 'invalid-token';

      invitationsRepository.findByToken.mockResolvedValueOnce(null);

      await expect(service.decline(token)).rejects.toThrow(NotFoundException);
      await expect(service.decline(token)).rejects.toThrow('Invitation not found or expired');
    });
  });
});


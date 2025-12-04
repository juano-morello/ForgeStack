import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { createMockOrganization, mockUUID } from '../../test/test-utils';

// Mock the repository module
jest.mock('./organizations.repository', () => ({
  OrganizationsRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findAllByUserId: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMembership: jest.fn(),
  })),
}));

import { OrganizationsRepository } from './organizations.repository';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let repository: jest.Mocked<OrganizationsRepository>;

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      create: jest.fn(),
      findAllByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMembership: jest.fn(),
    };

    const mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        {
          provide: OrganizationsRepository,
          useValue: mockRepository,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    repository = module.get(OrganizationsRepository);
  });

  describe('create', () => {
    it('should create and return a new organization', async () => {
      const userId = mockUUID();
      const dto = { name: 'New Organization' };
      const mockOrg = createMockOrganization({ name: dto.name, ownerUserId: userId });

      repository.create.mockResolvedValueOnce(mockOrg);

      const result = await service.create(userId, dto);

      expect(result).toEqual(mockOrg);
      expect(repository.create).toHaveBeenCalledWith(userId, { name: dto.name });
    });
  });

  describe('findAllForUser', () => {
    it('should return empty paginated result when user has no organizations', async () => {
      const userId = mockUUID();
      const query = { page: 1, limit: 10 };

      repository.findAllByUserId.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const result = await service.findAllForUser(userId, query);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
      expect(repository.findAllByUserId).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 10,
      });
    });

    it("should return user's organizations with roles in paginated format", async () => {
      const userId = mockUUID();
      const orgId = mockUUID();
      const mockOrg = createMockOrganization({ id: orgId });
      const query = { page: 1, limit: 10 };

      repository.findAllByUserId.mockResolvedValueOnce({
        items: [{ ...mockOrg, role: 'OWNER' }],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.findAllForUser(userId, query);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result.items).toHaveLength(1);
      expect(repository.findAllByUserId).toHaveBeenCalledWith(userId, {
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return organization when found', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const mockOrg = createMockOrganization({ id: orgId });

      repository.findMembership.mockResolvedValueOnce({ role: 'OWNER' });
      repository.findById.mockResolvedValueOnce(mockOrg);

      const result = await service.findOne(orgId, userId);

      expect(result).toEqual({ ...mockOrg, role: 'OWNER' });
    });

    it('should throw NotFoundException when membership not found', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();

      repository.findMembership.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when organization not found after membership verified', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();

      repository.findMembership.mockResolvedValueOnce({ role: 'OWNER' });
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.findOne(orgId, userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(orgId, userId)).rejects.toThrow('Organization not found');
    });
  });

  describe('update', () => {
    it('should update and return organization for OWNER', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const dto = { name: 'Updated Name' };
      const beforeOrg = createMockOrganization({ id: orgId, name: 'Old Name' });
      const mockOrg = createMockOrganization({ id: orgId, name: dto.name });

      repository.findMembership.mockResolvedValueOnce({ role: 'OWNER' });
      repository.findById.mockResolvedValueOnce(beforeOrg);
      repository.update.mockResolvedValueOnce(mockOrg);

      const result = await service.update(orgId, userId, dto);

      expect(result).toEqual(mockOrg);
    });

    it('should throw ForbiddenException for non-OWNER', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const dto = { name: 'Updated Name' };

      repository.findMembership.mockResolvedValueOnce({ role: 'MEMBER' });

      await expect(service.update(orgId, userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when membership not found', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const dto = { name: 'Updated Name' };

      repository.findMembership.mockResolvedValueOnce(null);

      await expect(service.update(orgId, userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when organization not found during update', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();
      const dto = { name: 'Updated Name' };

      repository.findMembership.mockResolvedValueOnce({ role: 'OWNER' });
      repository.update.mockResolvedValueOnce(null);

      await expect(service.update(orgId, userId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(orgId, userId, dto)).rejects.toThrow('Organization not found');
    });
  });

  describe('remove', () => {
    it('should delete organization for OWNER', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();

      repository.findMembership.mockResolvedValueOnce({ role: 'OWNER' });
      repository.delete.mockResolvedValueOnce(true);

      const result = await service.remove(orgId, userId);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw ForbiddenException for non-OWNER', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();

      repository.findMembership.mockResolvedValueOnce({ role: 'MEMBER' });

      await expect(service.remove(orgId, userId)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when membership not found', async () => {
      const orgId = mockUUID();
      const userId = mockUUID();

      repository.findMembership.mockResolvedValueOnce(null);

      await expect(service.remove(orgId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});


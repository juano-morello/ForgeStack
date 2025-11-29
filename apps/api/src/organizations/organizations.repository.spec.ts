import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsRepository } from './organizations.repository';
import { createMockOrganization, createMockTenantContext, mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  count: jest.fn(),
  inArray: jest.fn(),
  withServiceContext: jest.fn(),
  withTenantContext: jest.fn(),
  organizations: {},
  organizationMembers: {},
}));

import {
  withServiceContext,
  withTenantContext,
} from '@forgestack/db';

describe('OrganizationsRepository', () => {
  let repository: OrganizationsRepository;

  // Mock transaction object with chainable methods
  const createMockTx = () => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    set: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrganizationsRepository],
    }).compile();

    repository = module.get<OrganizationsRepository>(OrganizationsRepository);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create organization and add owner membership', async () => {
      const userId = mockUUID();
      const data = { name: 'New Organization' };
      const mockOrg = createMockOrganization({ name: data.name, ownerUserId: userId });
      const mockTx = createMockTx();

      // Mock the transaction flow
      mockTx.returning.mockResolvedValueOnce([mockOrg]); // For organization insert
      mockTx.values.mockReturnValueOnce(mockTx); // For membership insert

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.create(userId, data);

      expect(result).toEqual(mockOrg);
      expect(withServiceContext).toHaveBeenCalledWith(
        'OrganizationsRepository.create',
        expect.any(Function),
      );
      expect(mockTx.insert).toHaveBeenCalledTimes(2); // Once for org, once for membership
      expect(mockTx.values).toHaveBeenCalledWith({
        name: data.name,
        ownerUserId: userId,
      });
      expect(mockTx.values).toHaveBeenCalledWith({
        orgId: mockOrg.id,
        userId: userId,
        role: 'OWNER',
      });
    });

    it('should return the created organization', async () => {
      const userId = mockUUID();
      const data = { name: 'Test Org' };
      const mockOrg = createMockOrganization({ name: data.name });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockOrg]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.create(userId, data);

      expect(result).toBeDefined();
      expect(result.name).toBe(data.name);
    });
  });

  describe('findAllByUserId', () => {
    it('should return empty result when user has no memberships', async () => {
      const userId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]); // No memberships

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByUserId(userId);

      expect(result).toEqual({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });
    });

    it('should return paginated organizations with roles', async () => {
      const userId = mockUUID();
      const orgId1 = mockUUID();
      const orgId2 = mockUUID();
      const mockOrg1 = createMockOrganization({ id: orgId1, name: 'Org 1' });
      const mockOrg2 = createMockOrganization({ id: orgId2, name: 'Org 2' });
      const mockTx = createMockTx();

      const memberships = [
        { orgId: orgId1, role: 'OWNER' as const },
        { orgId: orgId2, role: 'MEMBER' as const },
      ];

      // Mock select for memberships
      mockTx.where.mockResolvedValueOnce(memberships);
      // Mock select for organizations
      mockTx.where.mockResolvedValueOnce([mockOrg1, mockOrg2]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByUserId(userId, { page: 1, limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should apply pagination correctly (offset, limit)', async () => {
      const userId = mockUUID();
      const orgIds = [mockUUID(), mockUUID(), mockUUID()];
      const mockOrgs = orgIds.map((id, idx) =>
        createMockOrganization({ id, name: `Org ${idx + 1}` })
      );
      const mockTx = createMockTx();

      const memberships = orgIds.map((orgId) => ({ orgId, role: 'MEMBER' as const }));

      // Mock select for memberships
      mockTx.where.mockResolvedValueOnce(memberships);
      // Mock select for organizations (only first 2 due to pagination)
      mockTx.where.mockResolvedValueOnce([mockOrgs[0], mockOrgs[1]]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findAllByUserId(userId, { page: 1, limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(2);
    });
  });

  describe('findById', () => {
    it('should return organization when found', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const mockOrg = createMockOrganization({ id: orgId });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([mockOrg]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(ctx, orgId);

      expect(result).toEqual(mockOrg);
      expect(withTenantContext).toHaveBeenCalledWith(ctx, expect.any(Function));
    });

    it('should return null when not found', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]); // No organization found

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(ctx, orgId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update and return organization', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const data = { name: 'Updated Name' };
      const mockOrg = createMockOrganization({ id: orgId, name: data.name });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockOrg]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.update(ctx, orgId, data);

      expect(result).toEqual(mockOrg);
      expect(mockTx.set).toHaveBeenCalledWith(data);
      expect(withTenantContext).toHaveBeenCalledWith(ctx, expect.any(Function));
    });

    it('should return null when organization not found', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const data = { name: 'Updated Name' };
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([]); // No organization found

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.update(ctx, orgId, data);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should return true when organization deleted', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const mockOrg = createMockOrganization({ id: orgId });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockOrg]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(ctx, orgId);

      expect(result).toBe(true);
      expect(withTenantContext).toHaveBeenCalledWith(ctx, expect.any(Function));
    });

    it('should return false when organization not found', async () => {
      const orgId = mockUUID();
      const ctx = createMockTenantContext({ orgId });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([]); // No organization found

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(ctx, orgId);

      expect(result).toBe(false);
    });
  });

  describe('findMembership', () => {
    it('should return membership with role when found', async () => {
      const userId = mockUUID();
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.limit.mockResolvedValueOnce([{ role: 'OWNER' }]);

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findMembership(userId, orgId);

      expect(result).toEqual({ role: 'OWNER' });
      expect(withServiceContext).toHaveBeenCalledWith(
        'OrganizationsRepository.findMembership',
        expect.any(Function),
      );
    });

    it('should return null when not a member', async () => {
      const userId = mockUUID();
      const orgId = mockUUID();
      const mockTx = createMockTx();

      mockTx.limit.mockResolvedValueOnce([]); // No membership found

      (withServiceContext as jest.Mock).mockImplementation(async (_name, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findMembership(userId, orgId);

      expect(result).toBeNull();
    });
  });
});


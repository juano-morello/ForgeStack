/**
 * Roles Repository Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RolesRepository } from './roles.repository';

// Mock @forgestack/db
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
};

jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  or: jest.fn(),
  isNull: jest.fn(),
  sql: jest.fn(),
  count: jest.fn(() => 'count'),
  withServiceContext: jest.fn((name, fn) => fn(mockDb)),
  roles: {},
  permissions: {},
  rolePermissions: {},
  memberRoles: {},
}));

describe('RolesRepository', () => {
  let repository: RolesRepository;

  const mockRole = {
    id: 'role-123',
    orgId: 'org-123',
    name: 'Custom Role',
    description: 'A custom role',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission = {
    id: 'perm-123',
    name: 'projects:read',
    description: 'Read projects',
    resource: 'projects',
    action: 'read',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesRepository],
    }).compile();

    repository = module.get<RolesRepository>(RolesRepository);

    jest.clearAllMocks();
  });

  describe('findAllForOrg', () => {
    it('should return all roles for an organization', async () => {
      const roles = [mockRole];
      const permissionCounts = [{ roleId: 'role-123', count: 2 }];
      const memberCounts = [{ roleId: 'role-123', count: 5 }];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(roles);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockResolvedValueOnce(permissionCounts);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.groupBy.mockResolvedValueOnce(memberCounts);

      const result = await repository.findAllForOrg('org-123');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockRole,
        permissionCount: 2,
        memberCount: 5,
      });
    });
  });

  describe('findOne', () => {
    it('should return a role with permissions', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([mockRole]);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([mockPermission]);

      const result = await repository.findOne('role-123');

      expect(result).toMatchObject({
        ...mockRole,
        permissions: [mockPermission],
      });
    });

    it('should return null if role not found', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findOne('role-123');

      expect(result).toBeNull();
    });
  });

  describe('findSystemRole', () => {
    it('should return a system role by name', async () => {
      const systemRole = { ...mockRole, isSystem: true, orgId: null };
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([systemRole]);

      const result = await repository.findSystemRole('Owner');

      expect(result).toEqual(systemRole);
    });

    it('should return null if system role not found', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.findSystemRole('NonExistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a role with permissions', async () => {
      const newRole = {
        orgId: 'org-123',
        name: 'New Role',
        description: 'A new role',
      };

      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([mockRole]);

      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockResolvedValueOnce(undefined);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([mockPermission]);

      const result = await repository.create(newRole, ['perm-123']);

      expect(result).toMatchObject({
        ...mockRole,
        permissions: [mockPermission],
      });
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updates = { name: 'Updated Role' };

      mockDb.update.mockReturnValueOnce(mockDb);
      mockDb.set.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([{ ...mockRole, ...updates }]);

      mockDb.delete.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);

      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockResolvedValueOnce(undefined);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([mockPermission]);

      const result = await repository.update('role-123', updates, ['perm-123']);

      expect(result.name).toBe('Updated Role');
    });
  });

  describe('delete', () => {
    it('should delete a role', async () => {
      mockDb.delete.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);

      await repository.delete('role-123');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('getMemberCount', () => {
    it('should return member count for a role', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ count: 5 }]);

      const result = await repository.getMemberCount('role-123');

      expect(result).toBe(5);
    });

    it('should return 0 if no members', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.getMemberCount('role-123');

      expect(result).toBe(0);
    });
  });

  describe('getMemberRoles', () => {
    it('should return member roles', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([mockRole]);

      const result = await repository.getMemberRoles('org-123', 'user-123');

      expect(result).toEqual([mockRole]);
    });
  });

  describe('assignRolesToMember', () => {
    it('should assign roles to a member', async () => {
      mockDb.delete.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(undefined);

      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockResolvedValueOnce(undefined);

      await repository.assignRolesToMember('org-123', 'user-123', ['role-123']);

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });
});


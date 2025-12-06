/**
 * Permissions Repository Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsRepository } from './permissions.repository';

// Mock @forgestack/db
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
};

jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  inArray: jest.fn(),
  withServiceContext: jest.fn((name, fn) => fn(mockDb)),
  permissions: {},
  roles: {},
  rolePermissions: {},
  memberRoles: {},
}));

describe('PermissionsRepository', () => {
  let repository: PermissionsRepository;

  const mockPermission = {
    id: 'perm-1',
    name: 'projects:read',
    description: 'Read projects',
    resource: 'projects',
    action: 'read',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsRepository],
    }).compile();

    repository = module.get<PermissionsRepository>(PermissionsRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all permissions', async () => {
      const permissions = [mockPermission];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(permissions);

      const result = await repository.findAll();

      expect(result).toEqual(permissions);
    });
  });

  describe('findByNames', () => {
    it('should return permissions by names', async () => {
      const permissions = [mockPermission];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(permissions);

      const result = await repository.findByNames(['projects:read']);

      expect(result).toEqual(permissions);
    });

    it('should return empty array for empty names', async () => {
      const result = await repository.findByNames([]);

      expect(result).toEqual([]);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return effective permissions for user', async () => {
      const permissionResults = [
        { permissionName: 'projects:read' },
        { permissionName: 'projects:write' },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(permissionResults);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.getEffectivePermissions('org-123', 'user-123');

      expect(result).toEqual(['projects:read', 'projects:write']);
    });

    it('should return wildcard for owner role', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.innerJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([{ permissionName: '*' }]);

      const result = await repository.getEffectivePermissions('org-123', 'user-123');

      expect(result).toEqual(['*']);
    });
  });
});


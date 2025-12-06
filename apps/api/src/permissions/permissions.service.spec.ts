/**
 * Permissions Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PermissionsRepository } from './permissions.repository';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionsRepository: jest.Mocked<PermissionsRepository>;

  const mockPermissions = [
    {
      id: 'perm-1',
      name: 'projects:read',
      description: 'Read projects',
      resource: 'projects',
      action: 'read',
    },
    {
      id: 'perm-2',
      name: 'projects:write',
      description: 'Write projects',
      resource: 'projects',
      action: 'write',
    },
    {
      id: 'perm-3',
      name: 'members:read',
      description: 'Read members',
      resource: 'members',
      action: 'read',
    },
  ];

  beforeEach(async () => {
    const mockPermissionsRepository = {
      findAll: jest.fn(),
      findByNames: jest.fn(),
      getEffectivePermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: PermissionsRepository,
          useValue: mockPermissionsRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionsRepository = module.get(PermissionsRepository);

    jest.clearAllMocks();
  });

  describe('hasPermission', () => {
    it('should return true for wildcard permission', async () => {
      permissionsRepository.getEffectivePermissions.mockResolvedValue(['*']);

      const result = await service.hasPermission('org-123', 'user-123', 'projects:read');

      expect(result).toBe(true);
    });

    it('should return true for exact permission match', async () => {
      permissionsRepository.getEffectivePermissions.mockResolvedValue(['projects:read']);

      const result = await service.hasPermission('org-123', 'user-123', 'projects:read');

      expect(result).toBe(true);
    });

    it('should return true for resource wildcard', async () => {
      permissionsRepository.getEffectivePermissions.mockResolvedValue(['projects:*']);

      const result = await service.hasPermission('org-123', 'user-123', 'projects:read');

      expect(result).toBe(true);
    });

    it('should return false when permission not found', async () => {
      permissionsRepository.getEffectivePermissions.mockResolvedValue(['members:read']);

      const result = await service.hasPermission('org-123', 'user-123', 'projects:read');

      expect(result).toBe(false);
    });

    it('should return false for empty permissions', async () => {
      permissionsRepository.getEffectivePermissions.mockResolvedValue([]);

      const result = await service.hasPermission('org-123', 'user-123', 'projects:read');

      expect(result).toBe(false);
    });
  });

  describe('getEffectivePermissions', () => {
    it('should return effective permissions from repository', async () => {
      const effectivePerms = ['projects:read', 'projects:write'];
      permissionsRepository.getEffectivePermissions.mockResolvedValue(effectivePerms);

      const result = await service.getEffectivePermissions('org-123', 'user-123');

      expect(result).toEqual(effectivePerms);
      expect(permissionsRepository.getEffectivePermissions).toHaveBeenCalledWith('org-123', 'user-123');
    });
  });

  describe('listAll', () => {
    it('should return all permissions', async () => {
      permissionsRepository.findAll.mockResolvedValue(mockPermissions);

      const result = await service.listAll();

      expect(result).toEqual(mockPermissions);
      expect(permissionsRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('listAllGrouped', () => {
    it('should return permissions grouped by resource', async () => {
      permissionsRepository.findAll.mockResolvedValue(mockPermissions);

      const result = await service.listAllGrouped();

      expect(result.permissions).toEqual(mockPermissions);
      expect(result.groupedByResource).toEqual({
        projects: [mockPermissions[0], mockPermissions[1]],
        members: [mockPermissions[2]],
      });
    });

    it('should handle empty permissions list', async () => {
      permissionsRepository.findAll.mockResolvedValue([]);

      const result = await service.listAllGrouped();

      expect(result.permissions).toEqual([]);
      expect(result.groupedByResource).toEqual({});
    });
  });
});


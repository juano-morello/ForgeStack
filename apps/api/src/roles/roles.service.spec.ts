/**
 * Roles Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { PermissionsRepository } from '../permissions/permissions.repository';

describe('RolesService', () => {
  let service: RolesService;
  let rolesRepository: jest.Mocked<RolesRepository>;
  let permissionsRepository: jest.Mocked<PermissionsRepository>;

  const mockRole = {
    id: 'role-123',
    orgId: 'org-123',
    name: 'Custom Role',
    description: 'A custom role',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
    permissionCount: 0,
    memberCount: 0,
  };

  const mockSystemRole = {
    id: 'role-owner',
    orgId: null,
    name: 'Owner',
    description: 'Organization owner',
    isSystem: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    permissions: [],
    permissionCount: 0,
    memberCount: 0,
  };

  const mockPermission = {
    id: 'perm-123',
    name: 'projects:read',
    description: 'Read projects',
    resource: 'projects',
    action: 'read',
  };

  beforeEach(async () => {
    const mockRolesRepository = {
      create: jest.fn(),
      findAllForOrg: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMemberCount: jest.fn(),
      getMemberRoles: jest.fn(),
      assignRolesToMember: jest.fn(),
      findSystemRole: jest.fn(),
    };

    const mockPermissionsRepository = {
      findByNames: jest.fn(),
      getEffectivePermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: RolesRepository,
          useValue: mockRolesRepository,
        },
        {
          provide: PermissionsRepository,
          useValue: mockPermissionsRepository,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    rolesRepository = module.get(RolesRepository);
    permissionsRepository = module.get(PermissionsRepository);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a role with valid permissions', async () => {
      const dto = {
        name: 'Custom Role',
        description: 'A custom role',
        permissionIds: ['perm-123'],
      };

      permissionsRepository.findByNames.mockResolvedValue([mockPermission]);
      rolesRepository.create.mockResolvedValue(mockRole);

      const result = await service.create('org-123', dto);

      expect(result).toEqual(mockRole);
      expect(rolesRepository.create).toHaveBeenCalledWith(
        {
          orgId: 'org-123',
          name: dto.name,
          description: dto.description,
        },
        dto.permissionIds,
      );
    });

    it('should throw BadRequestException for invalid permission ID', async () => {
      const dto = {
        name: 'Custom Role',
        description: 'A custom role',
        permissionIds: ['invalid-perm'],
      };

      permissionsRepository.findByNames.mockResolvedValue([]);

      await expect(service.create('org-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAllForOrg', () => {
    it('should return all roles for an organization', async () => {
      const roles = [mockRole, mockSystemRole];
      rolesRepository.findAllForOrg.mockResolvedValue(roles);

      const result = await service.findAllForOrg('org-123');

      expect(result).toEqual(roles);
      expect(rolesRepository.findAllForOrg).toHaveBeenCalledWith('org-123');
    });
  });

  describe('findOne', () => {
    it('should return a role by ID', async () => {
      rolesRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne('org-123', 'role-123');

      expect(result).toEqual(mockRole);
      expect(rolesRepository.findOne).toHaveBeenCalledWith('role-123');
    });

    it('should throw NotFoundException if role not found', async () => {
      rolesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('org-123', 'role-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if role belongs to different org', async () => {
      const differentOrgRole = { ...mockRole, orgId: 'org-456' };
      rolesRepository.findOne.mockResolvedValue(differentOrgRole);

      await expect(service.findOne('org-123', 'role-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow access to system roles from any org', async () => {
      rolesRepository.findOne.mockResolvedValue(mockSystemRole);

      const result = await service.findOne('org-123', 'role-owner');

      expect(result).toEqual(mockSystemRole);
    });
  });

  describe('update', () => {
    it('should update a custom role', async () => {
      const dto = {
        name: 'Updated Role',
        description: 'Updated description',
        permissionIds: ['perm-123'],
      };

      rolesRepository.findOne.mockResolvedValue(mockRole);
      permissionsRepository.findByNames.mockResolvedValue([mockPermission]);
      rolesRepository.update.mockResolvedValue({ ...mockRole, ...dto });

      const result = await service.update('org-123', 'role-123', dto);

      expect(result.name).toBe(dto.name);
      expect(rolesRepository.update).toHaveBeenCalledWith(
        'role-123',
        {
          name: dto.name,
          description: dto.description,
        },
        dto.permissionIds,
      );
    });

    it('should throw ForbiddenException when updating system role', async () => {
      const dto = { name: 'Updated Owner' };
      rolesRepository.findOne.mockResolvedValue(mockSystemRole);

      await expect(service.update('org-123', 'role-owner', dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException for invalid permission ID', async () => {
      const dto = {
        name: 'Updated Role',
        permissionIds: ['invalid-perm'],
      };

      rolesRepository.findOne.mockResolvedValue(mockRole);
      permissionsRepository.findByNames.mockResolvedValue([]);

      await expect(service.update('org-123', 'role-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a custom role with no members', async () => {
      rolesRepository.findOne.mockResolvedValue(mockRole);
      rolesRepository.getMemberCount.mockResolvedValue(0);
      rolesRepository.delete.mockResolvedValue(undefined);

      await service.delete('org-123', 'role-123');

      expect(rolesRepository.delete).toHaveBeenCalledWith('role-123');
    });

    it('should throw ForbiddenException when deleting system role', async () => {
      rolesRepository.findOne.mockResolvedValue(mockSystemRole);

      await expect(service.delete('org-123', 'role-owner')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when role has members', async () => {
      rolesRepository.findOne.mockResolvedValue(mockRole);
      rolesRepository.getMemberCount.mockResolvedValue(5);

      await expect(service.delete('org-123', 'role-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMemberRoles', () => {
    it('should return member roles', async () => {
      const roles = [mockRole];
      rolesRepository.getMemberRoles.mockResolvedValue(roles);

      const result = await service.getMemberRoles('org-123', 'user-123');

      expect(result).toEqual(roles);
      expect(rolesRepository.getMemberRoles).toHaveBeenCalledWith('org-123', 'user-123');
    });
  });

  describe('assignRolesToMember', () => {
    it('should assign roles to a member', async () => {
      const roleIds = ['role-123'];
      rolesRepository.findOne.mockResolvedValue(mockRole);
      rolesRepository.assignRolesToMember.mockResolvedValue(undefined);

      await service.assignRolesToMember('org-123', 'user-123', roleIds, 'admin-123');

      expect(rolesRepository.assignRolesToMember).toHaveBeenCalledWith(
        'org-123',
        'user-123',
        roleIds,
      );
    });

    it('should throw BadRequestException when no roles provided', async () => {
      await expect(
        service.assignRolesToMember('org-123', 'user-123', [], 'admin-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent removing Owner role from self', async () => {
      const ownerRole = mockSystemRole;
      const roleIds = ['role-123']; // Not including owner role

      rolesRepository.findOne.mockResolvedValue(mockRole);
      rolesRepository.findSystemRole.mockResolvedValue(ownerRole);
      rolesRepository.getMemberRoles.mockResolvedValue([ownerRole]);

      await expect(
        service.assignRolesToMember('org-123', 'user-123', roleIds, 'user-123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow removing Owner role from other users', async () => {
      const ownerRole = mockSystemRole;
      const roleIds = ['role-123'];

      rolesRepository.findOne.mockResolvedValue(mockRole);
      rolesRepository.findSystemRole.mockResolvedValue(ownerRole);
      rolesRepository.getMemberRoles.mockResolvedValue([ownerRole]);
      rolesRepository.assignRolesToMember.mockResolvedValue(undefined);

      await service.assignRolesToMember('org-123', 'user-456', roleIds, 'user-123');

      expect(rolesRepository.assignRolesToMember).toHaveBeenCalled();
    });
  });
});



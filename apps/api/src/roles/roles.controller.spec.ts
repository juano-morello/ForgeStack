/**
 * Roles Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RolesController, MemberRolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { PermissionsRepository } from '../permissions/permissions.repository';
import type { TenantContext } from '@forgestack/db';

describe('RolesController', () => {
  let controller: RolesController;
  let rolesService: jest.Mocked<RolesService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'OWNER',
  };

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

  beforeEach(async () => {
    const mockRolesService = {
      create: jest.fn(),
      findAllForOrg: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMemberRoles: jest.fn(),
      assignRolesToMember: jest.fn(),
    };

    const mockPermissionsRepository = {
      findAll: jest.fn(),
      findByNames: jest.fn(),
      getEffectivePermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: PermissionsRepository,
          useValue: mockPermissionsRepository,
        },
      ],
    }).compile();

    controller = module.get<RolesController>(RolesController);
    rolesService = module.get(RolesService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all roles for an organization', async () => {
      const roles = [mockRole];
      rolesService.findAllForOrg.mockResolvedValue(roles);

      const result = await controller.findAll(mockTenantContext);

      expect(result).toEqual(roles);
      expect(rolesService.findAllForOrg).toHaveBeenCalledWith('org-123');
    });
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const dto = {
        name: 'New Role',
        description: 'A new role',
        permissionIds: ['perm-123'],
      };

      rolesService.create.mockResolvedValue(mockRole);

      const result = await controller.create(mockTenantContext, dto);

      expect(result).toEqual(mockRole);
      expect(rolesService.create).toHaveBeenCalledWith('org-123', dto);
    });
  });

  describe('findOne', () => {
    it('should return a role by ID', async () => {
      rolesService.findOne.mockResolvedValue(mockRole);

      const result = await controller.findOne(mockTenantContext, 'role-123');

      expect(result).toEqual(mockRole);
      expect(rolesService.findOne).toHaveBeenCalledWith('org-123', 'role-123');
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const dto = {
        name: 'Updated Role',
        description: 'Updated description',
      };

      const updatedRole = { ...mockRole, ...dto };
      rolesService.update.mockResolvedValue(updatedRole);

      const result = await controller.update(mockTenantContext, 'role-123', dto);

      expect(result).toEqual(updatedRole);
      expect(rolesService.update).toHaveBeenCalledWith('org-123', 'role-123', dto);
    });
  });

  describe('remove', () => {
    it('should delete a role', async () => {
      rolesService.delete.mockResolvedValue(undefined);

      await controller.remove(mockTenantContext, 'role-123');

      expect(rolesService.delete).toHaveBeenCalledWith('org-123', 'role-123');
    });
  });
});

describe('MemberRolesController', () => {
  let controller: MemberRolesController;
  let rolesService: jest.Mocked<RolesService>;
  let permissionsRepository: jest.Mocked<PermissionsRepository>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'OWNER',
  };

  const mockRole = {
    id: 'role-123',
    orgId: 'org-123',
    name: 'Custom Role',
    description: 'A custom role',
    isSystem: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRolesService = {
      create: jest.fn(),
      findAllForOrg: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getMemberRoles: jest.fn(),
      assignRolesToMember: jest.fn(),
    };

    const mockPermissionsRepository = {
      findAll: jest.fn(),
      findByNames: jest.fn(),
      getEffectivePermissions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MemberRolesController],
      providers: [
        {
          provide: RolesService,
          useValue: mockRolesService,
        },
        {
          provide: PermissionsRepository,
          useValue: mockPermissionsRepository,
        },
      ],
    }).compile();

    controller = module.get<MemberRolesController>(MemberRolesController);
    rolesService = module.get(RolesService);
    permissionsRepository = module.get(PermissionsRepository);

    jest.clearAllMocks();
  });

  describe('getMemberRoles', () => {
    it('should return member roles and effective permissions', async () => {
      const roles = [mockRole];
      const effectivePermissions = ['projects:read', 'projects:write'];

      rolesService.getMemberRoles.mockResolvedValue(roles);
      permissionsRepository.getEffectivePermissions.mockResolvedValue(effectivePermissions);

      const result = await controller.getMemberRoles(mockTenantContext, 'user-456');

      expect(result).toEqual({
        userId: 'user-456',
        roles,
        effectivePermissions,
      });
      expect(rolesService.getMemberRoles).toHaveBeenCalledWith('org-123', 'user-456');
      expect(permissionsRepository.getEffectivePermissions).toHaveBeenCalledWith('org-123', 'user-456');
    });
  });

  describe('assignRoles', () => {
    it('should assign roles to a member', async () => {
      const dto = {
        roleIds: ['role-123', 'role-456'],
      };
      const roles = [mockRole];

      rolesService.assignRolesToMember.mockResolvedValue(undefined);
      rolesService.getMemberRoles.mockResolvedValue(roles);

      const result = await controller.assignRoles(mockTenantContext, 'user-456', dto);

      expect(result).toEqual({
        userId: 'user-456',
        roles,
      });
      expect(rolesService.assignRolesToMember).toHaveBeenCalledWith(
        'org-123',
        'user-456',
        dto.roleIds,
        'user-123',
      );
      expect(rolesService.getMemberRoles).toHaveBeenCalledWith('org-123', 'user-456');
    });
  });
});



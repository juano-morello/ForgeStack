/**
 * Permissions Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';

describe('PermissionsController', () => {
  let controller: PermissionsController;
  let permissionsService: jest.Mocked<PermissionsService>;

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
  ];

  beforeEach(async () => {
    const mockPermissionsService = {
      hasPermission: jest.fn(),
      getEffectivePermissions: jest.fn(),
      listAll: jest.fn(),
      listAllGrouped: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    controller = module.get<PermissionsController>(PermissionsController);
    permissionsService = module.get(PermissionsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all permissions grouped by resource', async () => {
      const groupedResult = {
        permissions: mockPermissions,
        groupedByResource: {
          projects: mockPermissions,
        },
      };

      permissionsService.listAllGrouped.mockResolvedValue(groupedResult);

      const result = await controller.findAll();

      expect(result).toEqual(groupedResult);
      expect(permissionsService.listAllGrouped).toHaveBeenCalled();
    });
  });
});


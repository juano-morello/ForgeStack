import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import {
  createMockProject,
  createMockTenantContext,
  mockUUID,
} from '../../test/test-utils';

// Mock the repository module
jest.mock('./projects.repository', () => ({
  ProjectsRepository: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
}));

import { ProjectsRepository } from './projects.repository';

// Define TenantContext type locally for tests
interface TenantContext {
  orgId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: jest.Mocked<ProjectsRepository>;
  let ownerCtx: TenantContext;
  let memberCtx: TenantContext;

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: ProjectsRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repository = module.get(ProjectsRepository);
    ownerCtx = createMockTenantContext({ role: 'OWNER' }) as TenantContext;
    memberCtx = createMockTenantContext({ role: 'MEMBER' }) as TenantContext;
  });

  describe('create', () => {
    it('should create and return a new project with valid data', async () => {
      const dto = { name: 'New Project', description: 'A test project' };
      const mockProject = createMockProject({ name: dto.name, description: dto.description });

      repository.create.mockResolvedValueOnce(mockProject);

      const result = await service.create(ownerCtx, dto);

      expect(result).toEqual(mockProject);
      expect(repository.create).toHaveBeenCalledWith(ownerCtx, {
        name: dto.name,
        description: dto.description,
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const mockProjects = [createMockProject(), createMockProject()];
      const query = { page: 1, limit: 10 };

      repository.findAll.mockResolvedValueOnce({
        items: mockProjects,
        total: 2,
        page: 1,
        limit: 10,
      });

      const result = await service.findAll(ownerCtx, query);

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(repository.findAll).toHaveBeenCalledWith(ownerCtx, {
        search: undefined,
        page: 1,
        limit: 10,
      });
    });

    it('should pass search parameter to repository', async () => {
      const query = { search: 'test', page: 1, limit: 10 };

      repository.findAll.mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      await service.findAll(ownerCtx, query);

      expect(repository.findAll).toHaveBeenCalledWith(ownerCtx, {
        search: 'test',
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a project when found', async () => {
      const projectId = mockUUID();
      const mockProject = createMockProject({ id: projectId });

      repository.findById.mockResolvedValueOnce(mockProject);

      const result = await service.findOne(ownerCtx, projectId);

      expect(result).toEqual(mockProject);
      expect(repository.findById).toHaveBeenCalledWith(ownerCtx, projectId);
    });

    it('should throw NotFoundException when project not found', async () => {
      const projectId = mockUUID();

      repository.findById.mockResolvedValueOnce(null);

      await expect(service.findOne(ownerCtx, projectId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the project', async () => {
      const projectId = mockUUID();
      const dto = { name: 'Updated Project', description: 'Updated description' };
      const mockProject = createMockProject({ id: projectId, name: dto.name });

      repository.update.mockResolvedValueOnce(mockProject);

      const result = await service.update(ownerCtx, projectId, dto);

      expect(result).toEqual(mockProject);
      expect(repository.update).toHaveBeenCalledWith(ownerCtx, projectId, {
        name: dto.name,
        description: dto.description,
      });
    });

    it('should throw NotFoundException when project not found', async () => {
      const projectId = mockUUID();
      const dto = { name: 'Updated Project' };

      repository.update.mockResolvedValueOnce(null);

      await expect(service.update(ownerCtx, projectId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should throw ForbiddenException for non-OWNER', async () => {
      const projectId = mockUUID();

      await expect(service.remove(memberCtx, projectId)).rejects.toThrow(
        ForbiddenException,
      );

      // Repository should not be called
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should delete project for OWNER', async () => {
      const projectId = mockUUID();
      const mockProject = createMockProject({ id: projectId });

      repository.delete.mockResolvedValueOnce(mockProject);

      const result = await service.remove(ownerCtx, projectId);

      expect(result).toEqual({ deleted: true });
      expect(repository.delete).toHaveBeenCalledWith(ownerCtx, projectId);
    });

    it('should throw NotFoundException when project not found', async () => {
      const projectId = mockUUID();

      repository.delete.mockResolvedValueOnce(null);

      await expect(service.remove(ownerCtx, projectId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});


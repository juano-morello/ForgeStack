import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsRepository } from './projects.repository';
import {
  createMockProject,
  createMockTenantContext,
  mockUUID,
} from '../../test/test-utils';

// Mock the @forgestack/db module
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(() => 'eq-condition'),
  or: jest.fn(() => 'or-condition'),
  desc: jest.fn(() => 'desc-order'),
  ilike: jest.fn(() => 'ilike-condition'),
  count: jest.fn(() => 'count-fn'),
  withTenantContext: jest.fn(),
  projects: {
    id: 'id',
    orgId: 'orgId',
    name: 'name',
    description: 'description',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

import { withTenantContext } from '@forgestack/db';

import type { OrgRole } from '@forgestack/shared';

// Define TenantContext type locally for tests
interface TenantContext {
  orgId: string;
  userId: string;
  role: OrgRole;
}

describe('ProjectsRepository', () => {
  let repository: ProjectsRepository;
  let mockTenantContext: TenantContext;

  // Helper to create a mock transaction object with chainable methods
  const createMockTx = () => ({
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProjectsRepository],
    }).compile();

    repository = module.get<ProjectsRepository>(ProjectsRepository);
    mockTenantContext = createMockTenantContext() as TenantContext;

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create project with orgId from context', async () => {
      const projectData = { name: 'New Project', description: 'Test description' };
      const mockProject = createMockProject({
        ...projectData,
        orgId: mockTenantContext.orgId,
      });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockProject]);
      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.create(mockTenantContext, projectData);

      expect(result).toEqual(mockProject);
      expect(withTenantContext).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Function),
      );
      expect(mockTx.insert).toHaveBeenCalled();
      expect(mockTx.values).toHaveBeenCalledWith({
        orgId: mockTenantContext.orgId,
        name: projectData.name,
        description: projectData.description,
      });
      expect(mockTx.returning).toHaveBeenCalled();
    });

    it('should return the created project', async () => {
      const projectData = { name: 'Another Project', description: 'Another description' };
      const mockProject = createMockProject(projectData);
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockProject]);
      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.create(mockTenantContext, projectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
      expect(result.description).toBe(projectData.description);
    });
  });

  describe('findAll', () => {
    it('should return paginated projects', async () => {
      const mockProjects = [createMockProject(), createMockProject()];

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        // Create separate mock chains for items query and count query
        const itemsQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue(mockProjects),
        };

        const countQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ count: 2 }]),
        };

        let callCount = 0;
        const mockTx = {
          select: jest.fn(() => {
            callCount++;
            return callCount === 1 ? itemsQuery : countQuery;
          }),
        };

        return callback(mockTx);
      });

      const result = await repository.findAll(mockTenantContext, { page: 1, limit: 10 });

      expect(result).toEqual({
        items: mockProjects,
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(withTenantContext).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Function),
      );
    });

    it('should apply search filter when provided', async () => {
      const searchTerm = 'test';
      const whereConditions: unknown[] = [];

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        const itemsQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn((condition) => {
            whereConditions.push(condition);
            return itemsQuery;
          }),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue([]),
        };

        const countQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn((condition) => {
            whereConditions.push(condition);
            return Promise.resolve([{ count: 0 }]);
          }),
        };

        let callCount = 0;
        const mockTx = {
          select: jest.fn(() => {
            callCount++;
            return callCount === 1 ? itemsQuery : countQuery;
          }),
        };

        return callback(mockTx);
      });

      await repository.findAll(mockTenantContext, { search: searchTerm, page: 1, limit: 10 });

      // Both queries (items and count) should have been called with a search condition (not undefined)
      expect(whereConditions.length).toBe(2);
      expect(whereConditions[0]).toBeDefined();
      expect(whereConditions[1]).toBeDefined();
    });

    it('should use default pagination when not specified', async () => {
      let limitValue: number | undefined;
      let offsetValue: number | undefined;

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        const itemsQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn((val) => {
            limitValue = val;
            return itemsQuery;
          }),
          offset: jest.fn((val) => {
            offsetValue = val;
            return Promise.resolve([]);
          }),
        };

        const countQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        };

        let callCount = 0;
        const mockTx = {
          select: jest.fn(() => {
            callCount++;
            return callCount === 1 ? itemsQuery : countQuery;
          }),
        };

        return callback(mockTx);
      });

      const result = await repository.findAll(mockTenantContext, {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(limitValue).toBe(10);
      expect(offsetValue).toBe(0);
    });

    it('should calculate total count correctly', async () => {
      const totalCount = 25;

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        const itemsQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue([]),
        };

        const countQuery = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([{ count: totalCount }]),
        };

        let callCount = 0;
        const mockTx = {
          select: jest.fn(() => {
            callCount++;
            return callCount === 1 ? itemsQuery : countQuery;
          }),
        };

        return callback(mockTx);
      });

      const result = await repository.findAll(mockTenantContext, { page: 2, limit: 10 });

      expect(result.total).toBe(totalCount);
    });
  });

  describe('findById', () => {
    it('should return project when found', async () => {
      const projectId = mockUUID();
      const mockProject = createMockProject({ id: projectId });
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([mockProject]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(mockTenantContext, projectId);

      expect(result).toEqual(mockProject);
      expect(withTenantContext).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Function),
      );
      expect(mockTx.select).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
    });

    it('should return null when not found', async () => {
      const projectId = mockUUID();
      const mockTx = createMockTx();

      mockTx.where.mockResolvedValueOnce([]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.findById(mockTenantContext, projectId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update project with new data', async () => {
      const projectId = mockUUID();
      const updateData = { name: 'Updated Name', description: 'Updated description' };
      const mockProject = createMockProject({ id: projectId, ...updateData });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockProject]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.update(mockTenantContext, projectId, updateData);

      expect(result).toEqual(mockProject);
      expect(withTenantContext).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Function),
      );
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
      expect(mockTx.returning).toHaveBeenCalled();
    });

    it('should set updatedAt timestamp', async () => {
      const projectId = mockUUID();
      const updateData = { name: 'Updated Name' };
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([createMockProject()]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      await repository.update(mockTenantContext, projectId, updateData);

      expect(mockTx.set).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should return null when project not found', async () => {
      const projectId = mockUUID();
      const updateData = { name: 'Updated Name' };
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.update(mockTenantContext, projectId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete and return the project', async () => {
      const projectId = mockUUID();
      const mockProject = createMockProject({ id: projectId });
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([mockProject]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(mockTenantContext, projectId);

      expect(result).toEqual(mockProject);
      expect(withTenantContext).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Function),
      );
      expect(mockTx.delete).toHaveBeenCalled();
      expect(mockTx.where).toHaveBeenCalled();
      expect(mockTx.returning).toHaveBeenCalled();
    });

    it('should return null when project not found', async () => {
      const projectId = mockUUID();
      const mockTx = createMockTx();

      mockTx.returning.mockResolvedValueOnce([]);

      (withTenantContext as jest.Mock).mockImplementation(async (_ctx, callback) => {
        return callback(mockTx);
      });

      const result = await repository.delete(mockTenantContext, projectId);

      expect(result).toBeNull();
    });
  });
});


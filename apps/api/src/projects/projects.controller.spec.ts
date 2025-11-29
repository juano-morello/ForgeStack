import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

// Mock the @forgestack/db module to prevent import errors
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  or: jest.fn(),
  ilike: jest.fn(),
  desc: jest.fn(),
  count: jest.fn(),
  withTenantContext: jest.fn(),
  projects: {},
}));

// Helper function to generate mock UUID
const mockUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Helper function to create mock project
const createMockProject = (overrides: Record<string, unknown> = {}) => ({
  id: mockUUID(),
  orgId: 'test-org-id',
  name: 'Test Project',
  description: 'Test project description',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper function to create mock tenant context
const createMockTenantContext = (overrides: Record<string, unknown> = {}) => ({
  orgId: 'test-org-id',
  userId: 'test-user-id',
  role: 'OWNER',
  ...overrides,
});

describe('ProjectsController (Integration)', () => {
  let app: INestApplication;
  let projectsService: jest.Mocked<ProjectsService>;

  const mockOrgId = mockUUID();
  const mockUserId = mockUUID();
  const mockProjectId = mockUUID();
  const mockProject = createMockProject({ id: mockProjectId, orgId: mockOrgId });
  const mockTenantCtx = createMockTenantContext({
    orgId: mockOrgId,
    userId: mockUserId,
    role: 'OWNER',
  });

  beforeEach(async () => {
    const mockProjectsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: mockProjectsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mock the tenant context decorator by attaching it to the request
    app.use((req: { tenantContext: typeof mockTenantCtx }, _res: unknown, next: () => void) => {
      req.tenantContext = mockTenantCtx;
      next();
    });

    await app.init();

    projectsService = moduleRef.get(ProjectsService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /projects', () => {
    it('should create a new project', async () => {
      const createDto = { name: 'Test Project', description: 'A test project' };
      projectsService.create.mockResolvedValue(mockProject);

      const response = await request(app.getHttpServer())
        .post('/projects')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({ id: mockProjectId }));
    });
  });

  describe('GET /projects', () => {
    it('should return paginated list of projects', async () => {
      const paginatedResult = {
        items: [mockProject, createMockProject()],
        total: 2,
        page: 1,
        limit: 10,
      };
      projectsService.findAll.mockResolvedValue(paginatedResult);

      const response = await request(app.getHttpServer())
        .get('/projects')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('page', 1);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return a specific project', async () => {
      projectsService.findOne.mockResolvedValue(mockProject);

      const response = await request(app.getHttpServer())
        .get(`/projects/${mockProjectId}`)
        .expect(200);

      expect(response.body.id).toBe(mockProjectId);
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update a project', async () => {
      const updateDto = { name: 'Updated Project Name' };
      const updatedProject = { ...mockProject, name: updateDto.name };
      projectsService.update.mockResolvedValue(updatedProject);

      const response = await request(app.getHttpServer())
        .patch(`/projects/${mockProjectId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project for OWNER', async () => {
      projectsService.remove.mockResolvedValue({ deleted: true });

      const response = await request(app.getHttpServer())
        .delete(`/projects/${mockProjectId}`)
        .expect(200);

      expect(response.body).toEqual({ deleted: true });
    });

    it('should return 403 when non-OWNER tries to delete', async () => {
      projectsService.remove.mockRejectedValue(
        new ForbiddenException('Only owners can delete projects'),
      );

      await request(app.getHttpServer())
        .delete(`/projects/${mockProjectId}`)
        .expect(403);
    });
  });
});


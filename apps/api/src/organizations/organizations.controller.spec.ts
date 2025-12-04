import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';

// Mock the @forgestack/db module to prevent import errors
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  withTenantContext: jest.fn(),
  organizations: {},
  organizationMembers: {},
}));

// Helper function to generate mock UUID
const mockUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Helper function to create mock organization
const createMockOrganization = (overrides: Record<string, unknown> = {}) => ({
  id: mockUUID(),
  name: 'Test Organization',
  ownerUserId: 'test-user-id',
  logo: null as string | null,
  timezone: 'UTC',
  language: 'en',
  suspendedAt: null as Date | null,
  suspendedReason: null as string | null,
  suspendedBy: null as string | null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('OrganizationsController (Integration)', () => {
  let app: INestApplication;
  let organizationsService: jest.Mocked<OrganizationsService>;

  const mockUserId = mockUUID();
  const mockOrgId = mockUUID();
  const mockOrg = createMockOrganization({ id: mockOrgId });

  beforeEach(async () => {
    const mockOrganizationsService = {
      create: jest.fn(),
      findAllForUser: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mock the request user
    app.use((req: { user: { id: string } }, _res: unknown, next: () => void) => {
      req.user = { id: mockUserId };
      next();
    });

    await app.init();

    organizationsService = moduleRef.get(OrganizationsService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /organizations', () => {
    it('should create a new organization', async () => {
      const createDto = { name: 'Test Organization' };
      organizationsService.create.mockResolvedValue(mockOrg);

      const response = await request(app.getHttpServer())
        .post('/organizations')
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({ id: mockOrgId }));
      expect(organizationsService.create).toHaveBeenCalledWith(mockUserId, createDto);
    });
  });

  describe('GET /organizations', () => {
    it('should return paginated list of organizations', async () => {
      const orgs = [
        { ...mockOrg, role: 'OWNER' as const },
        { ...createMockOrganization(), role: 'MEMBER' as const },
      ];
      const paginatedResponse = {
        items: orgs,
        total: 2,
        page: 1,
        limit: 10,
      };
      organizationsService.findAllForUser.mockResolvedValue(paginatedResponse);

      const response = await request(app.getHttpServer())
        .get('/organizations')
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items).toHaveLength(2);
      expect(organizationsService.findAllForUser).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
      );
    });

    it('should accept pagination query parameters', async () => {
      const paginatedResponse = {
        items: [{ ...mockOrg, role: 'OWNER' as const }],
        total: 1,
        page: 2,
        limit: 5,
      };
      organizationsService.findAllForUser.mockResolvedValue(paginatedResponse);

      const response = await request(app.getHttpServer())
        .get('/organizations?page=2&limit=5')
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(5);
      // Query params are passed as strings before transformation
      expect(organizationsService.findAllForUser).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Object),
      );
    });
  });

  describe('PATCH /organizations/:id', () => {
    it('should update organization for OWNER', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedOrg = { ...mockOrg, name: updateDto.name };
      organizationsService.update.mockResolvedValue(updatedOrg);

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${mockOrgId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.name).toBe(updateDto.name);
    });

    it('should return 403 when non-OWNER tries to update', async () => {
      const updateDto = { name: 'Updated Name' };
      organizationsService.update.mockRejectedValue(
        new ForbiddenException('Only owners can update the organization'),
      );

      await request(app.getHttpServer())
        .patch(`/organizations/${mockOrgId}`)
        .send(updateDto)
        .expect(403);
    });
  });

  describe('DELETE /organizations/:id', () => {
    it('should delete organization for OWNER', async () => {
      organizationsService.remove.mockResolvedValue({ deleted: true });

      const response = await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}`)
        .expect(200);

      expect(response.body).toEqual({ deleted: true });
    });

    it('should return 403 when non-OWNER tries to delete', async () => {
      organizationsService.remove.mockRejectedValue(
        new ForbiddenException('Only owners can delete the organization'),
      );

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}`)
        .expect(403);
    });
  });
});


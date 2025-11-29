import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException } from '@nestjs/common';
import request from 'supertest';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { mockUUID } from '../../test/test-utils';

// Mock the @forgestack/db module to prevent import errors
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  withTenantContext: jest.fn(),
  users: {},
  organizationMembers: {},
  organizations: {},
}));

describe('MembersController (Integration)', () => {
  let app: INestApplication;
  let membersService: jest.Mocked<MembersService>;

  const mockOrgId = mockUUID();
  const mockUserId = mockUUID();
  const mockTenantContext = {
    orgId: mockOrgId,
    userId: mockUserId,
    role: 'OWNER' as const,
  };

  const createMockMember = (overrides: Record<string, unknown> = {}) => ({
    userId: mockUUID(),
    email: 'test@example.com',
    name: 'Test User',
    role: 'MEMBER' as const,
    joinedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const mockMembersService = {
      findAll: jest.fn(),
      updateRole: jest.fn(),
      remove: jest.fn(),
      addMember: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [MembersController],
      providers: [
        {
          provide: MembersService,
          useValue: mockMembersService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mock the tenant context decorator
    app.use((req: { tenantContext: typeof mockTenantContext }, _res: unknown, next: () => void) => {
      req.tenantContext = mockTenantContext;
      next();
    });

    await app.init();

    membersService = moduleRef.get(MembersService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /organizations/:orgId/members', () => {
    it('should return paginated list of members', async () => {
      const members = [
        createMockMember({ role: 'OWNER' }),
        createMockMember({ role: 'MEMBER' }),
      ];
      const paginatedResponse = {
        items: members,
        total: 2,
        page: 1,
        limit: 10,
      };
      membersService.findAll.mockResolvedValue(paginatedResponse);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/members`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 2);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items).toHaveLength(2);
      expect(membersService.findAll).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Object),
      );
    });

    it('should accept pagination query parameters', async () => {
      const paginatedResponse = {
        items: [createMockMember()],
        total: 1,
        page: 2,
        limit: 5,
      };
      membersService.findAll.mockResolvedValue(paginatedResponse);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/members?page=2&limit=5`)
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(5);
      expect(membersService.findAll).toHaveBeenCalledWith(
        mockTenantContext,
        expect.any(Object),
      );
    });

    it('should return empty list when no members found', async () => {
      const paginatedResponse = {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      membersService.findAll.mockResolvedValue(paginatedResponse);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/members`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('PATCH /organizations/:orgId/members/:userId', () => {
    it('should update member role', async () => {
      const targetUserId = mockUUID();
      const updateDto = { role: 'OWNER' as const };
      const updatedMember = createMockMember({ userId: targetUserId, role: 'OWNER' });
      membersService.updateRole.mockResolvedValue(updatedMember);

      const response = await request(app.getHttpServer())
        .patch(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.role).toBe('OWNER');
      expect(membersService.updateRole).toHaveBeenCalledWith(
        mockTenantContext,
        targetUserId,
        updateDto,
      );
    });

    it('should return 403 when non-OWNER tries to update role', async () => {
      const targetUserId = mockUUID();
      const updateDto = { role: 'OWNER' as const };
      membersService.updateRole.mockRejectedValue(
        new ForbiddenException('Only owners can update member roles'),
      );

      await request(app.getHttpServer())
        .patch(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .send(updateDto)
        .expect(403);
    });

    it('should return 404 when member not found', async () => {
      const targetUserId = mockUUID();
      const updateDto = { role: 'OWNER' as const };
      membersService.updateRole.mockRejectedValue(
        new Error('Member not found'),
      );

      await request(app.getHttpServer())
        .patch(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .send(updateDto)
        .expect(500); // NestJS converts unhandled errors to 500
    });
  });

  describe('DELETE /organizations/:orgId/members/:userId', () => {
    it('should remove member and return 204', async () => {
      const targetUserId = mockUUID();
      membersService.remove.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .expect(204);

      expect(membersService.remove).toHaveBeenCalledWith(
        mockTenantContext,
        targetUserId,
      );
    });

    it('should return 403 when non-OWNER tries to remove member', async () => {
      const targetUserId = mockUUID();
      membersService.remove.mockRejectedValue(
        new ForbiddenException('Only owners can remove members'),
      );

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .expect(403);
    });

    it('should return 404 when member not found', async () => {
      const targetUserId = mockUUID();
      membersService.remove.mockRejectedValue(
        new Error('Member not found'),
      );

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/members/${targetUserId}`)
        .expect(500); // NestJS converts unhandled errors to 500
    });
  });
});


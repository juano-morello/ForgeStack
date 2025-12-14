import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ForbiddenException, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { InvitationsController, PublicInvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { RateLimitingService } from '../rate-limiting/rate-limiting.service';
import {
  createMockInvitation,
  createMockOrganization,
  createMockTenantContext,
  mockUUID,
} from '../../test/test-utils';

// Mock the @forgestack/db module to prevent import errors
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  gt: jest.fn(),
  withServiceContext: jest.fn(),
  invitations: {},
  organizationMembers: {},
  organizations: {},
  users: {},
}));

describe('InvitationsController (Integration)', () => {
  let app: INestApplication;
  let invitationsService: jest.Mocked<InvitationsService>;

  const mockUserId = mockUUID();
  const mockOrgId = mockUUID();
  const mockCtx = createMockTenantContext({ userId: mockUserId, orgId: mockOrgId, role: 'OWNER' });

  beforeEach(async () => {
    const mockInvitationsService = {
      create: jest.fn(),
      findAllForOrg: jest.fn(),
      cancel: jest.fn(),
      accept: jest.fn(),
      decline: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mock the request user and tenant context
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = { id: mockUserId, email: 'test@example.com' };
      req.tenantContext = mockCtx;
      next();
    });

    await app.init();

    invitationsService = moduleRef.get(InvitationsService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /organizations/:orgId/invitations', () => {
    it('should create a new invitation', async () => {
      const createDto = { email: 'newuser@example.com', role: 'MEMBER' as const };
      const mockInvitation = createMockInvitation({
        orgId: mockOrgId,
        email: createDto.email,
        role: createDto.role,
      });

      invitationsService.create.mockResolvedValue(mockInvitation);

      const response = await request(app.getHttpServer())
        .post(`/organizations/${mockOrgId}/invitations`)
        .send(createDto)
        .expect(201);

      expect(response.body).toEqual(expect.objectContaining({ id: mockInvitation.id }));
      expect(invitationsService.create).toHaveBeenCalledWith(mockCtx, createDto);
    });

    it('should return 403 when non-OWNER tries to create invitation', async () => {
      const createDto = { email: 'newuser@example.com', role: 'MEMBER' as const };

      invitationsService.create.mockRejectedValue(
        new ForbiddenException('Only owners can invite members'),
      );

      await request(app.getHttpServer())
        .post(`/organizations/${mockOrgId}/invitations`)
        .send(createDto)
        .expect(403);
    });
  });

  describe('GET /organizations/:orgId/invitations', () => {
    it('should return paginated list of invitations', async () => {
      const mockInvitations = {
        items: [createMockInvitation({ orgId: mockOrgId })],
        total: 1,
        page: 1,
        limit: 10,
      };

      invitationsService.findAllForOrg.mockResolvedValue(mockInvitations);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/invitations`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(invitationsService.findAllForOrg).toHaveBeenCalledWith(
        mockCtx,
        expect.any(Object),
      );
    });

    it('should accept pagination query parameters', async () => {
      const mockInvitations = {
        items: [createMockInvitation({ orgId: mockOrgId })],
        total: 5,
        page: 2,
        limit: 5,
      };

      invitationsService.findAllForOrg.mockResolvedValue(mockInvitations);

      const response = await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/invitations?page=2&limit=5`)
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(5);
    });

    it('should return 403 when non-OWNER tries to list invitations', async () => {
      invitationsService.findAllForOrg.mockRejectedValue(
        new ForbiddenException('Only owners can view invitations'),
      );

      await request(app.getHttpServer())
        .get(`/organizations/${mockOrgId}/invitations`)
        .expect(403);
    });
  });

  describe('DELETE /organizations/:orgId/invitations/:id', () => {
    it('should cancel an invitation', async () => {
      const invitationId = mockUUID();

      invitationsService.cancel.mockResolvedValue({ deleted: true });

      const response = await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/invitations/${invitationId}`)
        .expect(200);

      expect(response.body).toEqual({ deleted: true });
      expect(invitationsService.cancel).toHaveBeenCalledWith(mockCtx, invitationId);
    });

    it('should return 404 when invitation not found', async () => {
      const invitationId = mockUUID();

      invitationsService.cancel.mockRejectedValue(new NotFoundException('Invitation not found'));

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/invitations/${invitationId}`)
        .expect(404);
    });

    it('should return 403 when non-OWNER tries to cancel', async () => {
      const invitationId = mockUUID();

      invitationsService.cancel.mockRejectedValue(
        new ForbiddenException('Only owners can cancel invitations'),
      );

      await request(app.getHttpServer())
        .delete(`/organizations/${mockOrgId}/invitations/${invitationId}`)
        .expect(403);
    });
  });
});

describe('PublicInvitationsController (Integration)', () => {
  let app: INestApplication;
  let invitationsService: jest.Mocked<InvitationsService>;
  let rateLimitingService: jest.Mocked<RateLimitingService>;

  const mockUserId = mockUUID();
  const mockUserEmail = 'test@example.com';

  beforeEach(async () => {
    const mockInvitationsService = {
      create: jest.fn(),
      findAllForOrg: jest.fn(),
      cancel: jest.fn(),
      accept: jest.fn(),
      decline: jest.fn(),
    };

    const mockRateLimitingService = {
      checkLimit: jest.fn().mockResolvedValue({
        allowed: true,
        limit: 5,
        remaining: 4,
        reset: Math.floor(Date.now() / 1000) + 60,
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PublicInvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: mockInvitationsService,
        },
        {
          provide: RateLimitingService,
          useValue: mockRateLimitingService,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    // Mock the request user for authenticated endpoints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = { id: mockUserId, email: mockUserEmail };
      next();
    });

    await app.init();

    invitationsService = moduleRef.get(InvitationsService);
    rateLimitingService = moduleRef.get(RateLimitingService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /invitations/accept', () => {
    it('should accept an invitation', async () => {
      const acceptDto = { token: 'a'.repeat(64) };
      const mockOrg = createMockOrganization({ id: mockUUID(), name: 'Test Org' });
      const mockResult = { organization: mockOrg, role: 'MEMBER' as const };

      invitationsService.accept.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer())
        .post('/invitations/accept')
        .send(acceptDto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          organization: expect.objectContaining({
            id: mockOrg.id,
            name: mockOrg.name,
          }),
          role: 'MEMBER',
        }),
      );
      expect(invitationsService.accept).toHaveBeenCalledWith(
        mockUserId,
        mockUserEmail,
        acceptDto.token,
      );
      expect(rateLimitingService.checkLimit).toHaveBeenCalledWith(
        expect.stringContaining('invitation_accept:'),
        5,
        'minute',
      );
    });

    it('should return 404 when invitation not found', async () => {
      const acceptDto = { token: 'invalid-token' };

      invitationsService.accept.mockRejectedValue(
        new NotFoundException('Invitation not found or expired'),
      );

      await request(app.getHttpServer())
        .post('/invitations/accept')
        .send(acceptDto)
        .expect(404);
    });

    it('should return 429 when rate limit exceeded', async () => {
      const acceptDto = { token: 'a'.repeat(64) };

      rateLimitingService.checkLimit.mockResolvedValueOnce({
        allowed: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
        retryAfter: 60,
      });

      const response = await request(app.getHttpServer())
        .post('/invitations/accept')
        .send(acceptDto)
        .expect(429);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 429,
          message: expect.stringContaining('Too many invitation acceptance attempts'),
        }),
      );
      expect(invitationsService.accept).not.toHaveBeenCalled();
    });
  });

  describe('POST /invitations/decline', () => {
    it('should decline an invitation', async () => {
      const declineDto = { token: 'a'.repeat(64) };

      invitationsService.decline.mockResolvedValue({ deleted: true });

      const response = await request(app.getHttpServer())
        .post('/invitations/decline')
        .send(declineDto)
        .expect(201);

      expect(response.body).toEqual({ deleted: true });
      expect(invitationsService.decline).toHaveBeenCalledWith(declineDto.token);
      expect(rateLimitingService.checkLimit).toHaveBeenCalledWith(
        expect.stringContaining('invitation_decline:'),
        5,
        'minute',
      );
    });

    it('should return 404 when invitation not found', async () => {
      const declineDto = { token: 'invalid-token' };

      invitationsService.decline.mockRejectedValue(
        new NotFoundException('Invitation not found or expired'),
      );

      await request(app.getHttpServer())
        .post('/invitations/decline')
        .send(declineDto)
        .expect(404);
    });

    it('should return 429 when rate limit exceeded', async () => {
      const declineDto = { token: 'a'.repeat(64) };

      rateLimitingService.checkLimit.mockResolvedValueOnce({
        allowed: false,
        limit: 5,
        remaining: 0,
        reset: Math.floor(Date.now() / 1000) + 60,
        retryAfter: 60,
      });

      const response = await request(app.getHttpServer())
        .post('/invitations/decline')
        .send(declineDto)
        .expect(429);

      expect(response.body).toEqual(
        expect.objectContaining({
          statusCode: 429,
          message: expect.stringContaining('Too many invitation decline attempts'),
        }),
      );
      expect(invitationsService.decline).not.toHaveBeenCalled();
    });
  });
});


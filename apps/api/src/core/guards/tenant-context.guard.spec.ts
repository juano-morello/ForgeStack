import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContextGuard } from './tenant-context.guard';
import { AuthService } from '../../auth/auth.service';
import { OrganizationsRepository } from '../../organizations/organizations.repository';
import { mockUUID } from '../../../test/test-utils';

// Mock the repository module
jest.mock('../../organizations/organizations.repository', () => ({
  OrganizationsRepository: jest.fn().mockImplementation(() => ({
    findMembership: jest.fn(),
  })),
}));

// Mock @forgestack/db for withServiceContext
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  subscriptions: {},
  eq: jest.fn(),
}));

import { withServiceContext } from '@forgestack/db';

describe('TenantContextGuard', () => {
  let guard: TenantContextGuard;
  let reflector: jest.Mocked<Reflector>;
  let authService: jest.Mocked<AuthService>;
  let organizationsRepository: jest.Mocked<OrganizationsRepository>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockRequest: any;

  beforeEach(async () => {
    // Mock withServiceContext to return a subscription with plan
    (withServiceContext as jest.Mock).mockImplementation(
      async (_name: string, callback: (tx: unknown) => Promise<unknown>) => {
        const mockTx = {
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue([{ plan: 'pro' }]),
        };
        return callback(mockTx);
      },
    );

    // Create mock services
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const mockAuthService = {
      extractSessionToken: jest.fn(),
      verifySession: jest.fn(),
    };

    const mockOrganizationsRepository = {
      findMembership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantContextGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: OrganizationsRepository,
          useValue: mockOrganizationsRepository,
        },
      ],
    }).compile();

    guard = module.get<TenantContextGuard>(TenantContextGuard);
    reflector = module.get(Reflector);
    authService = module.get(AuthService);
    organizationsRepository = module.get(OrganizationsRepository);

    // Setup mock request
    mockRequest = {
      headers: {},
      cookies: {},
      user: undefined,
      session: undefined,
      tenantContext: undefined,
    };

    // Setup mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate - Public routes', () => {
    it('should return true when route is marked as public', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true); // IS_PUBLIC_KEY

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(authService.extractSessionToken).not.toHaveBeenCalled();
    });
  });

  describe('canActivate - Authentication', () => {
    beforeEach(() => {
      reflector.getAllAndOverride.mockReturnValueOnce(false); // IS_PUBLIC_KEY = false
    });

    it('should throw UnauthorizedException when no session token is found', async () => {
      authService.extractSessionToken.mockReturnValue(undefined);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Authentication required'),
      );

      expect(authService.extractSessionToken).toHaveBeenCalledWith(mockRequest);
    });

    it('should throw UnauthorizedException when session verification fails', async () => {
      authService.extractSessionToken.mockReturnValue('invalid-token');
      authService.verifySession.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Authentication required'),
      );

      expect(authService.verifySession).toHaveBeenCalledWith('invalid-token');
    });
  });

  describe('canActivate - NoOrgRequired routes', () => {
    const userId = mockUUID();
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(true); // NO_ORG_REQUIRED_KEY = true

      authService.extractSessionToken.mockReturnValue('valid-token');
      authService.verifySession.mockResolvedValue({
        user: mockUser,
        session: {
          id: 'session-id',
          userId,
          expiresAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should return true and attach user context when NoOrgRequired is set', async () => {
      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.tenantContext).toBeUndefined();
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('noOrgRequired', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });

  describe('canActivate - Organization context required', () => {
    const userId = mockUUID();
    const orgId = mockUUID();
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY = false
        .mockReturnValueOnce(false); // NO_ORG_REQUIRED_KEY = false

      authService.extractSessionToken.mockReturnValue('valid-token');
      authService.verifySession.mockResolvedValue({
        user: mockUser,
        session: {
          id: 'session-id',
          userId,
          expiresAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });
    });

    it('should throw ForbiddenException when X-Org-Id header is missing', async () => {
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('X-Org-Id header required'),
      );
    });

    it('should throw UnauthorizedException when userId has invalid format', async () => {
      // UUID_REGEX requires valid UUID format, use a non-UUID string
      const invalidUserId = 'not-a-valid-uuid';
      authService.verifySession.mockResolvedValue({
        user: { ...mockUser, id: invalidUserId },
        session: {
          id: 'session-id',
          userId: invalidUserId,
          expiresAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });
      mockRequest.headers['x-org-id'] = orgId;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException('Invalid user ID format'),
      );
    });

    it('should throw ForbiddenException when orgId has invalid UUID format', async () => {
      mockRequest.headers['x-org-id'] = 'invalid-org-id';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('Invalid organization ID format'),
      );
    });

    it('should throw ForbiddenException when user is not a member of the organization', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('Not a member of this organization'),
      );

      expect(organizationsRepository.findMembership).toHaveBeenCalledWith(userId, orgId);
    });

    it('should return true and set tenantContext when user is OWNER', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockResolvedValue({ role: 'OWNER' });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.tenantContext).toEqual({
        orgId,
        userId,
        role: 'OWNER',
        plan: 'pro',
      });
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should return true and set tenantContext when user is MEMBER', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockResolvedValue({ role: 'MEMBER' });

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.tenantContext).toEqual({
        orgId,
        userId,
        role: 'MEMBER',
        plan: 'pro',
      });
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw ForbiddenException when database query fails', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockRejectedValue(new Error('Database error'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new ForbiddenException('Not a member of this organization'),
      );
    });

    it('should default to free plan when subscription fetch fails', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockResolvedValue({ role: 'OWNER' });

      // Mock withServiceContext to throw an error
      (withServiceContext as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.tenantContext).toEqual({
        orgId,
        userId,
        role: 'OWNER',
        plan: 'free',
      });
    });

    it('should default to free plan when no subscription exists', async () => {
      mockRequest.headers['x-org-id'] = orgId;

      organizationsRepository.findMembership.mockResolvedValue({ role: 'OWNER' });

      // Mock withServiceContext to return empty result
      (withServiceContext as jest.Mock).mockImplementationOnce(
        async (_name: string, callback: (tx: unknown) => Promise<unknown>) => {
          const mockTx = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([]),
          };
          return callback(mockTx);
        },
      );

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.tenantContext).toEqual({
        orgId,
        userId,
        role: 'OWNER',
        plan: 'free',
      });
    });
  });

  describe('Reflector metadata extraction', () => {
    it('should correctly extract IS_PUBLIC_KEY metadata', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(true);

      await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should correctly extract NO_ORG_REQUIRED_KEY metadata', async () => {
      const userId = mockUUID();
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(true); // NO_ORG_REQUIRED_KEY

      authService.extractSessionToken.mockReturnValue('valid-token');
      authService.verifySession.mockResolvedValue({
        user: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: 'session-id',
          userId,
          expiresAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenNthCalledWith(2, 'noOrgRequired', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });
  });

  describe('Session token extraction', () => {
    const userId = mockUUID();
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // IS_PUBLIC_KEY
        .mockReturnValueOnce(true); // NO_ORG_REQUIRED_KEY
    });

    it('should extract session token from cookies', async () => {
      authService.extractSessionToken.mockReturnValue('cookie-token');
      authService.verifySession.mockResolvedValue({
        user: mockUser,
        session: {
          id: 'session-id',
          userId,
          expiresAt: new Date(),
          ipAddress: null,
          userAgent: null,
        },
      });

      await guard.canActivate(mockExecutionContext);

      expect(authService.extractSessionToken).toHaveBeenCalledWith(mockRequest);
      expect(authService.verifySession).toHaveBeenCalledWith('cookie-token');
    });

    it('should attach user and session to request after verification', async () => {
      const mockSession = {
        id: 'session-id',
        userId,
        expiresAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      };

      authService.extractSessionToken.mockReturnValue('valid-token');
      authService.verifySession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockRequest.session).toEqual(mockSession);
    });
  });
});


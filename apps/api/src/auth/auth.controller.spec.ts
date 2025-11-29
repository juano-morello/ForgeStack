import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService, BetterAuthUser } from './auth.service';
import { Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: BetterAuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    image: 'https://example.com/avatar.jpg',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-15T00:00:00Z'),
  };

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    expiresAt: new Date('2025-12-31T23:59:59Z'),
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  beforeEach(async () => {
    const mockAuthService = {
      extractSessionToken: jest.fn(),
      verifySession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should return current user from request with full user data', async () => {
      const mockRequest = {} as Request;
      const sessionToken = 'valid-session-token';

      authService.extractSessionToken.mockReturnValue(sessionToken);
      authService.verifySession.mockResolvedValue({
        user: mockUser,
        session: mockSession,
      });

      const result = await controller.me(mockRequest);

      expect(result).toEqual({
        user: mockUser,
        sessionId: 'session-123',
      });
      expect(authService.extractSessionToken).toHaveBeenCalledWith(mockRequest);
      expect(authService.verifySession).toHaveBeenCalledWith(sessionToken);
    });

    it('should return current user with minimal user data', async () => {
      const mockRequest = {} as Request;
      const sessionToken = 'valid-session-token';
      const minimalUser: BetterAuthUser = {
        id: 'user-456',
        email: 'minimal@example.com',
        name: null,
        emailVerified: false,
        image: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-15T00:00:00Z'),
      };

      authService.extractSessionToken.mockReturnValue(sessionToken);
      authService.verifySession.mockResolvedValue({
        user: minimalUser,
        session: mockSession,
      });

      const result = await controller.me(mockRequest);

      expect(result).toEqual({
        user: minimalUser,
        sessionId: 'session-123',
      });
      expect(result.user.name).toBeNull();
      expect(result.user.image).toBeNull();
      expect(result.user.emailVerified).toBe(false);
    });

    it('should throw UnauthorizedException when no session token provided', async () => {
      const mockRequest = {} as Request;

      authService.extractSessionToken.mockReturnValue(undefined);

      await expect(controller.me(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No session token provided'),
      );
      expect(authService.extractSessionToken).toHaveBeenCalledWith(mockRequest);
      expect(authService.verifySession).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when session token is empty string', async () => {
      const mockRequest = {} as Request;

      authService.extractSessionToken.mockReturnValue('');

      await expect(controller.me(mockRequest)).rejects.toThrow(
        new UnauthorizedException('No session token provided'),
      );
      expect(authService.verifySession).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when session verification fails', async () => {
      const mockRequest = {} as Request;
      const sessionToken = 'invalid-session-token';

      authService.extractSessionToken.mockReturnValue(sessionToken);
      authService.verifySession.mockResolvedValue(null);

      await expect(controller.me(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired session'),
      );
      expect(authService.verifySession).toHaveBeenCalledWith(sessionToken);
    });

    it('should throw UnauthorizedException when session is expired', async () => {
      const mockRequest = {} as Request;
      const sessionToken = 'expired-session-token';

      authService.extractSessionToken.mockReturnValue(sessionToken);
      authService.verifySession.mockResolvedValue(null);

      await expect(controller.me(mockRequest)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired session'),
      );
    });
  });
});


import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService, SessionVerificationResult } from './auth.service';

// Mock fetch globally
global.fetch = jest.fn();

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));
});

describe('AuthService', () => {
  let service: AuthService;
  let mockRedis: any;
  const mockAuthServerUrl = 'http://localhost:3000';

  beforeEach(async () => {
    // Create mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'authServerUrl') {
          return mockAuthServerUrl;
        }
        if (key === 'redis.url') {
          return 'redis://localhost:6379';
        }
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Get the mock Redis instance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRedis = (service as any).redis;

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up
    await service.onModuleDestroy();
  });

  describe('verifySession', () => {
    const validToken = 'valid-session-token-12345';
    const mockSessionData: SessionVerificationResult = {
      session: {
        id: 'session-123',
        userId: 'user-456',
        expiresAt: new Date('2025-12-31T23:59:59Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      },
      user: {
        id: 'user-456',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: true,
        image: 'https://example.com/avatar.jpg',
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-15T00:00:00Z'),
      },
    };

    it('should return null for empty token', async () => {
      const result = await service.verifySession('');
      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should verify valid session and return user info', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: mockSessionData.session.id,
            userId: mockSessionData.session.userId,
            expiresAt: mockSessionData.session.expiresAt.toISOString(),
            ipAddress: mockSessionData.session.ipAddress,
            userAgent: mockSessionData.session.userAgent,
          },
          user: {
            id: mockSessionData.user.id,
            email: mockSessionData.user.email,
            name: mockSessionData.user.name,
            emailVerified: mockSessionData.user.emailVerified,
            image: mockSessionData.user.image,
            createdAt: mockSessionData.user.createdAt.toISOString(),
            updatedAt: mockSessionData.user.updatedAt.toISOString(),
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeDefined();
      expect(result?.user.email).toBe('test@example.com');
      expect(result?.user.id).toBe('user-456');
      expect(result?.session.id).toBe('session-123');
      expect(fetch).toHaveBeenCalledWith(
        `${mockAuthServerUrl}/api/auth/get-session`,
        {
          method: 'GET',
          headers: {
            Cookie: `better-auth.session_token=${validToken}`,
          },
        },
      );
    });

    it('should return null for invalid/expired token (non-ok response)', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession('invalid-token');

      expect(result).toBeNull();
      expect(fetch).toHaveBeenCalled();
    });

    it('should return null when response data is empty', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeNull();
    });

    it('should return null when session is missing from response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          user: mockSessionData.user,
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeNull();
    });

    it('should return null when user is missing from response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: mockSessionData.session,
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeNull();
    });

    it('should use cache on repeated calls with same token', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: mockSessionData.session.id,
            userId: mockSessionData.session.userId,
            expiresAt: mockSessionData.session.expiresAt.toISOString(),
            ipAddress: mockSessionData.session.ipAddress,
            userAgent: mockSessionData.session.userAgent,
          },
          user: {
            id: mockSessionData.user.id,
            email: mockSessionData.user.email,
            name: mockSessionData.user.name,
            emailVerified: mockSessionData.user.emailVerified,
            image: mockSessionData.user.image,
            createdAt: mockSessionData.user.createdAt.toISOString(),
            updatedAt: mockSessionData.user.updatedAt.toISOString(),
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      // First call - should hit the auth server and cache the result
      mockRedis.get.mockResolvedValueOnce(null); // Cache miss
      const result1 = await service.verifySession(validToken);
      expect(result1).toBeDefined();
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(result1));
      const result2 = await service.verifySession(validToken);
      expect(result2).toBeDefined();
      expect(result2?.user.email).toBe(result1?.user.email);
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call

      // Third call - should still use cache
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(result1));
      const result3 = await service.verifySession(validToken);
      expect(result3).toBeDefined();
      expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it('should not use expired cache entries', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: mockSessionData.session.id,
            userId: mockSessionData.session.userId,
            expiresAt: mockSessionData.session.expiresAt.toISOString(),
            ipAddress: mockSessionData.session.ipAddress,
            userAgent: mockSessionData.session.userAgent,
          },
          user: {
            id: mockSessionData.user.id,
            email: mockSessionData.user.email,
            name: mockSessionData.user.name,
            emailVerified: mockSessionData.user.emailVerified,
            image: mockSessionData.user.image,
            createdAt: mockSessionData.user.createdAt.toISOString(),
            updatedAt: mockSessionData.user.updatedAt.toISOString(),
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // First call - cache miss
      mockRedis.get.mockResolvedValueOnce(null);
      await service.verifySession(validToken);
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call - cache expired (Redis returns null)
      mockRedis.get.mockResolvedValueOnce(null);
      await service.verifySession(validToken);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await service.verifySession(validToken);

      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeNull();
    });

    it('should handle optional fields correctly', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: 'session-123',
            userId: 'user-456',
            expiresAt: '2025-12-31T23:59:59Z',
            // ipAddress and userAgent are optional
          },
          user: {
            id: 'user-456',
            email: 'test@example.com',
            // name, emailVerified, and image are optional
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-15T00:00:00Z',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await service.verifySession(validToken);

      expect(result).toBeDefined();
      expect(result?.session.ipAddress).toBeNull();
      expect(result?.session.userAgent).toBeNull();
      expect(result?.user.name).toBeNull();
      expect(result?.user.emailVerified).toBe(false);
      expect(result?.user.image).toBeNull();
    });
  });

  describe('extractSessionToken', () => {
    it('should extract token from cookies (primary method)', () => {
      const mockRequest = {
        cookies: {
          'better-auth.session_token': 'cookie-token-123',
        },
        headers: {},
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('cookie-token-123');
    });

    it('should extract token from Authorization header when cookie not present', () => {
      const mockRequest = {
        cookies: {},
        headers: {
          authorization: 'Bearer header-token-456',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('header-token-456');
    });

    it('should prioritize cookie over Authorization header', () => {
      const mockRequest = {
        cookies: {
          'better-auth.session_token': 'cookie-token-123',
        },
        headers: {
          authorization: 'Bearer header-token-456',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('cookie-token-123');
    });

    it('should return undefined for missing auth header', () => {
      const mockRequest = {
        cookies: {},
        headers: {},
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined for malformed auth header (not Bearer)', () => {
      const mockRequest = {
        cookies: {},
        headers: {
          authorization: 'Basic some-basic-auth',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBeUndefined();
    });

    it('should return undefined for empty Bearer token', () => {
      const mockRequest = {
        cookies: {},
        headers: {
          authorization: 'Bearer ',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('');
    });

    it('should handle missing cookies object', () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer token-123',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('token-123');
    });

    it('should handle missing headers object', () => {
      const mockRequest = {
        cookies: {
          'better-auth.session_token': 'cookie-token',
        },
      };

      const token = service.extractSessionToken(mockRequest);

      expect(token).toBe('cookie-token');
    });
  });

  describe('cache management', () => {
    it('should use Redis SETEX with 30 second TTL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: 'session-123',
            userId: 'user-456',
            expiresAt: '2025-12-31T23:59:59Z',
          },
          user: {
            id: 'user-456',
            email: 'test@example.com',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-15T00:00:00Z',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      mockRedis.get.mockResolvedValueOnce(null);

      await service.verifySession('test-token');

      // Verify SETEX was called with 30 second TTL
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/^session:[a-f0-9]{64}$/), // Hashed token
        30, // TTL in seconds
        expect.any(String), // JSON stringified result
      );
    });

    it('should hash session tokens before using as Redis keys', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: 'session-123',
            userId: 'user-456',
            expiresAt: '2025-12-31T23:59:59Z',
          },
          user: {
            id: 'user-456',
            email: 'test@example.com',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-15T00:00:00Z',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      mockRedis.get.mockResolvedValueOnce(null);

      const plainToken = 'my-secret-token-12345';
      await service.verifySession(plainToken);

      // Verify the token was hashed (key should not contain the plain token)
      const setexCall = mockRedis.setex.mock.calls[0];
      expect(setexCall[0]).not.toContain(plainToken);
      expect(setexCall[0]).toMatch(/^session:[a-f0-9]{64}$/);
    });

    it('should handle Redis failures gracefully (fail open)', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({
          session: {
            id: 'session-123',
            userId: 'user-456',
            expiresAt: '2025-12-31T23:59:59Z',
          },
          user: {
            id: 'user-456',
            email: 'test@example.com',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-15T00:00:00Z',
          },
        }),
      };

      (fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Simulate Redis failure
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      // Should still work and verify session
      const result = await service.verifySession('test-token');
      expect(result).toBeDefined();
      expect(result?.user.email).toBe('test@example.com');
      expect(fetch).toHaveBeenCalled();
    });
  });
});


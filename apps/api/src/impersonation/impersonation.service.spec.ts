import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ImpersonationService } from './impersonation.service';
import { ImpersonationRepository } from './impersonation.repository';
import { PlatformAuditService, type PlatformAuditContext } from '../admin/platform-audit/platform-audit.service';
import { mockUUID } from '../../test/test-utils';
import type { ImpersonationSession } from '@forgestack/db';

describe('ImpersonationService', () => {
  let service: ImpersonationService;
  let repository: jest.Mocked<ImpersonationRepository>;
  let platformAuditService: jest.Mocked<PlatformAuditService>;

  const mockAuditContext: PlatformAuditContext = {
    actorId: mockUUID(),
    actorEmail: 'admin@example.com',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
  };

  const createMockUser = (overrides: Record<string, unknown> = {}) => ({
    id: mockUUID(),
    email: 'user@example.com',
    name: 'Test User',
    isSuperAdmin: false,
    suspendedAt: null,
    ...overrides,
  });

  const createMockSession = (overrides: Partial<ImpersonationSession> = {}): ImpersonationSession => ({
    id: mockUUID(),
    actorId: mockUUID(),
    targetUserId: mockUUID(),
    token: 'mock-token-hash-' + Math.random().toString(36),
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    endedAt: null,
    actionsCount: 0,
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      findActiveByActor: jest.fn(),
      findAllActive: jest.fn(),
      endSession: jest.fn(),
      incrementActionCount: jest.fn(),
      findById: jest.fn(),
      findUserById: jest.fn(),
    };

    const mockPlatformAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpersonationService,
        {
          provide: ImpersonationRepository,
          useValue: mockRepository,
        },
        {
          provide: PlatformAuditService,
          useValue: mockPlatformAuditService,
        },
      ],
    }).compile();

    service = module.get<ImpersonationService>(ImpersonationService);
    repository = module.get(ImpersonationRepository);
    platformAuditService = module.get(PlatformAuditService);
  });

  describe('startImpersonation', () => {
    const actorId = mockUUID();
    const targetUserId = mockUUID();
    const durationMinutes = 60;
    const ipAddress = '127.0.0.1';
    const userAgent = 'Mozilla/5.0';

    it('should successfully start impersonation', async () => {
      const actor = createMockUser({ id: actorId, isSuperAdmin: true });
      const targetUser = createMockUser({ id: targetUserId });
      const mockSession = createMockSession({ actorId, targetUserId });

      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);
      repository.findActiveByActor.mockResolvedValueOnce(null);
      repository.create.mockResolvedValueOnce(mockSession);

      const result = await service.startImpersonation(
        actorId,
        targetUserId,
        durationMinutes,
        ipAddress,
        userAgent,
        mockAuditContext,
      );

      // Result should have the plain token added by the service
      expect(result).toEqual(expect.objectContaining({
        ...mockSession,
        token: expect.any(String),
      }));
      expect(repository.findUserById).toHaveBeenCalledWith(actorId);
      expect(repository.findUserById).toHaveBeenCalledWith(targetUserId);
      expect(repository.findActiveByActor).toHaveBeenCalledWith(actorId);
      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId,
          targetUserId,
          token: expect.any(String), // Stored as hash in the 'token' column
          startedAt: expect.any(Date),
          expiresAt: expect.any(Date),
          endedAt: null,
          actionsCount: 0,
          ipAddress,
          userAgent,
        }),
      );
      expect(platformAuditService.log).toHaveBeenCalledWith(
        mockAuditContext,
        expect.objectContaining({
          action: 'impersonation.started',
          resourceType: 'user',
          resourceId: targetUserId,
          resourceName: targetUser.email,
        }),
      );
    });

    it('should throw NotFoundException when actor not found', async () => {
      repository.findUserById.mockResolvedValueOnce(null);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('Actor user not found');
    });

    it('should throw NotFoundException when target user not found', async () => {
      const actor = createMockUser({ id: actorId, isSuperAdmin: true });
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(null);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(NotFoundException);

      // Reset mocks and test again for error message
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(null);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('Target user not found');
    });

    it('should throw BadRequestException when trying to impersonate yourself', async () => {
      const userId = mockUUID();
      const actor = createMockUser({ id: userId, isSuperAdmin: true });
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(actor);

      await expect(
        service.startImpersonation(userId, userId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(BadRequestException);

      // Reset mocks and test again for error message
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(actor);

      await expect(
        service.startImpersonation(userId, userId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('Cannot impersonate yourself');
    });

    it('should throw ForbiddenException when trying to impersonate super-admin', async () => {
      const actor = createMockUser({ id: actorId, isSuperAdmin: true });
      const targetUser = createMockUser({ id: targetUserId, isSuperAdmin: true });
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(ForbiddenException);

      // Reset mocks and test again for error message
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('Cannot impersonate other super-admin users');
    });

    it('should throw ForbiddenException when trying to impersonate suspended user', async () => {
      const actor = createMockUser({ id: actorId, isSuperAdmin: true });
      const targetUser = createMockUser({ id: targetUserId, suspendedAt: new Date() });
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(ForbiddenException);

      // Reset mocks and test again for error message
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('Cannot impersonate suspended users');
    });

    it('should throw BadRequestException when actor already has active session', async () => {
      const actor = createMockUser({ id: actorId, isSuperAdmin: true });
      const targetUser = createMockUser({ id: targetUserId });
      const existingSession = createMockSession({ actorId });

      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);
      repository.findActiveByActor.mockResolvedValueOnce(existingSession);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow(BadRequestException);

      // Reset mocks and test again for error message
      repository.findUserById.mockResolvedValueOnce(actor);
      repository.findUserById.mockResolvedValueOnce(targetUser);
      repository.findActiveByActor.mockResolvedValueOnce(existingSession);

      await expect(
        service.startImpersonation(actorId, targetUserId, durationMinutes, ipAddress, userAgent, mockAuditContext),
      ).rejects.toThrow('You already have an active impersonation session. End it first.');
    });
  });

  describe('endImpersonation', () => {
    const token = 'mock-token-123';

    it('should successfully end impersonation', async () => {
      const sessionId = mockUUID();
      const targetUserId = mockUUID();
      const startedAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const endedAt = new Date();

      const session = createMockSession({
        id: sessionId,
        targetUserId,
        startedAt,
        endedAt: null,
      });

      const updatedSession = {
        ...session,
        endedAt,
      };

      const targetUser = createMockUser({ id: targetUserId, email: 'target@example.com' });

      repository.findByTokenHash.mockResolvedValueOnce(session);
      repository.endSession.mockResolvedValueOnce(updatedSession);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      const result = await service.endImpersonation(token, mockAuditContext);

      expect(result).toEqual(updatedSession);
      expect(repository.findByTokenHash).toHaveBeenCalledWith(expect.any(String)); // Called with hash
      expect(repository.endSession).toHaveBeenCalledWith(sessionId);
      expect(platformAuditService.log).toHaveBeenCalledWith(
        mockAuditContext,
        expect.objectContaining({
          action: 'impersonation.ended',
          resourceType: 'user',
          resourceId: targetUserId,
          resourceName: targetUser.email,
          metadata: expect.objectContaining({
            sessionId,
            duration: expect.any(Number),
            actionsPerformed: session.actionsCount,
          }),
        }),
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      repository.findByTokenHash.mockResolvedValueOnce(null);

      await expect(service.endImpersonation(token, mockAuditContext)).rejects.toThrow(NotFoundException);
      await expect(service.endImpersonation(token, mockAuditContext)).rejects.toThrow(
        'Impersonation session not found',
      );
    });

    it('should throw BadRequestException when session already ended', async () => {
      const session = createMockSession({
        endedAt: new Date(),
      });

      repository.findByTokenHash.mockResolvedValueOnce(session);

      await expect(service.endImpersonation(token, mockAuditContext)).rejects.toThrow(BadRequestException);

      // Reset mocks and test again for error message
      repository.findByTokenHash.mockResolvedValueOnce(session);

      await expect(service.endImpersonation(token, mockAuditContext)).rejects.toThrow('Session already ended');
    });
  });

  describe('validateSession', () => {
    const token = 'mock-token-123';

    it('should return session when valid', async () => {
      const session = createMockSession({
        endedAt: null,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      });

      repository.findByTokenHash.mockResolvedValueOnce(session);

      const result = await service.validateSession(token);

      expect(result).toEqual(session);
      expect(repository.findByTokenHash).toHaveBeenCalledWith(expect.any(String)); // Called with hash
    });

    it('should return null when session not found', async () => {
      repository.findByTokenHash.mockResolvedValueOnce(null);

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });

    it('should return null when session ended', async () => {
      const session = createMockSession({
        endedAt: new Date(),
      });

      repository.findByTokenHash.mockResolvedValueOnce(session);

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });

    it('should return null when session expired', async () => {
      const session = createMockSession({
        endedAt: null,
        expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      });

      repository.findByTokenHash.mockResolvedValueOnce(session);

      const result = await service.validateSession(token);

      expect(result).toBeNull();
    });
  });

  describe('getActiveSession', () => {
    it('should return active session for actor', async () => {
      const actorId = mockUUID();
      const session = createMockSession({ actorId });

      repository.findActiveByActor.mockResolvedValueOnce(session);

      const result = await service.getActiveSession(actorId);

      expect(result).toEqual(session);
      expect(repository.findActiveByActor).toHaveBeenCalledWith(actorId);
    });

    it('should return null when no active session exists', async () => {
      const actorId = mockUUID();

      repository.findActiveByActor.mockResolvedValueOnce(null);

      const result = await service.getActiveSession(actorId);

      expect(result).toBeNull();
    });
  });

  describe('getActiveSessions', () => {
    it('should return all active sessions', async () => {
      const sessions = [
        createMockSession({ actorId: mockUUID() }),
        createMockSession({ actorId: mockUUID() }),
        createMockSession({ actorId: mockUUID() }),
      ];

      repository.findAllActive.mockResolvedValueOnce(sessions);

      const result = await service.getActiveSessions();

      expect(result).toEqual(sessions);
      expect(result).toHaveLength(3);
      expect(repository.findAllActive).toHaveBeenCalled();
    });

    it('should return empty array when no active sessions exist', async () => {
      repository.findAllActive.mockResolvedValueOnce([]);

      const result = await service.getActiveSessions();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('forceEndSession', () => {
    const sessionId = mockUUID();

    it('should successfully force end session', async () => {
      const targetUserId = mockUUID();
      const session = createMockSession({
        id: sessionId,
        targetUserId,
        endedAt: null,
      });

      const updatedSession = {
        ...session,
        endedAt: new Date(),
      };

      const targetUser = createMockUser({ id: targetUserId, email: 'target@example.com' });

      repository.findById.mockResolvedValueOnce(session);
      repository.endSession.mockResolvedValueOnce(updatedSession);
      repository.findUserById.mockResolvedValueOnce(targetUser);

      const result = await service.forceEndSession(sessionId, mockAuditContext);

      expect(result).toEqual(updatedSession);
      expect(repository.findById).toHaveBeenCalledWith(sessionId);
      expect(repository.endSession).toHaveBeenCalledWith(sessionId);
      expect(platformAuditService.log).toHaveBeenCalledWith(
        mockAuditContext,
        expect.objectContaining({
          action: 'impersonation.force_ended',
          resourceType: 'user',
          resourceId: targetUserId,
          resourceName: targetUser.email,
          metadata: expect.objectContaining({
            sessionId,
            forcedBy: mockAuditContext.actorId,
          }),
        }),
      );
    });

    it('should throw NotFoundException when session not found', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.forceEndSession(sessionId, mockAuditContext)).rejects.toThrow(NotFoundException);
      await expect(service.forceEndSession(sessionId, mockAuditContext)).rejects.toThrow('Session not found');
    });

    it('should throw BadRequestException when session already ended', async () => {
      const session = createMockSession({
        id: sessionId,
        endedAt: new Date(),
      });

      repository.findById.mockResolvedValueOnce(session);

      await expect(service.forceEndSession(sessionId, mockAuditContext)).rejects.toThrow(BadRequestException);

      // Reset mocks and test again for error message
      repository.findById.mockResolvedValueOnce(session);

      await expect(service.forceEndSession(sessionId, mockAuditContext)).rejects.toThrow('Session already ended');
    });
  });

  describe('incrementActionCount', () => {
    it('should increment action count for session', async () => {
      const sessionId = mockUUID();

      repository.incrementActionCount.mockResolvedValueOnce(undefined);

      await service.incrementActionCount(sessionId);

      expect(repository.incrementActionCount).toHaveBeenCalledWith(sessionId);
    });
  });
});

/**
 * Users Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueueService } from '../queue/queue.service';

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  users: {},
  accounts: {},
  verifications: {},
}));

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    image: null,
    isSuperAdmin: false,
    suspendedAt: null,
    suspendedReason: null,
    suspendedBy: null,
    lastLoginAt: null,
    onboardingCompletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateProfile: jest.fn(),
      updateOnboardingStatus: jest.fn(),
    };

    const mockAuditLogsService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const mockQueueService = {
      addJob: jest.fn().mockResolvedValue(undefined),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
        {
          provide: AuditLogsService,
          useValue: mockAuditLogsService,
        },
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
    auditLogsService = module.get(AuditLogsService) as jest.Mocked<AuditLogsService>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('should return needsOnboarding: true when onboardingCompletedAt is null', async () => {
      repository.findById.mockResolvedValueOnce(mockUser);

      const result = await service.getOnboardingStatus('user-123');

      expect(result).toEqual({
        needsOnboarding: true,
        completedAt: null,
      });
      expect(repository.findById).toHaveBeenCalledWith('user-123');
    });

    it('should return needsOnboarding: false when onboardingCompletedAt is set', async () => {
      const completedAt = new Date('2024-01-01T00:00:00Z');
      const completedUser = { ...mockUser, onboardingCompletedAt: completedAt };
      repository.findById.mockResolvedValueOnce(completedUser);

      const result = await service.getOnboardingStatus('user-123');

      expect(result).toEqual({
        needsOnboarding: false,
        completedAt,
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.getOnboardingStatus('user-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should mark onboarding as complete and log audit event', async () => {
      repository.findById.mockResolvedValueOnce(mockUser);
      repository.updateOnboardingStatus.mockResolvedValueOnce();

      const result = await service.completeOnboarding('user-123');

      expect(result.completedAt).toBeInstanceOf(Date);
      expect(repository.updateOnboardingStatus).toHaveBeenCalledWith(
        'user-123',
        expect.any(Date),
      );
      expect(auditLogsService.log).toHaveBeenCalledWith(
        {
          orgId: null,
          actorId: 'user-123',
          actorType: 'user',
        },
        {
          action: 'user.onboarding_completed',
          resourceType: 'user',
          resourceId: 'user-123',
          resourceName: 'Test User',
        },
      );
    });

    it('should be idempotent - return existing timestamp if already completed', async () => {
      const completedAt = new Date('2024-01-01T00:00:00Z');
      const completedUser = { ...mockUser, onboardingCompletedAt: completedAt };
      repository.findById.mockResolvedValueOnce(completedUser);

      const result = await service.completeOnboarding('user-123');

      expect(result.completedAt).toEqual(completedAt);
      expect(repository.updateOnboardingStatus).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(service.completeOnboarding('user-123')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.updateOnboardingStatus).not.toHaveBeenCalled();
    });
  });
});


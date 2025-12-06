/**
 * Users Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueueService } from '../queue/queue.service';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  users: {},
  accounts: {},
  verifications: {},
}));

import { withServiceContext } from '@forgestack/db';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;
  let auditLogsService: jest.Mocked<AuditLogsService>;
  let queueService: jest.Mocked<QueueService>;

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
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
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
    queueService = module.get(QueueService) as jest.Mocked<QueueService>;

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default withServiceContext mock
    (withServiceContext as jest.Mock).mockImplementation(
      async <T>(_name: string, callback: (tx: unknown) => Promise<T>) => {
        return callback({
          select: jest.fn().mockReturnThis(),
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
        });
      },
    );
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const updateDto = {
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      };

      const updatedUser = {
        ...mockUser,
        name: updateDto.name,
        image: updateDto.image,
        updatedAt: new Date('2024-01-03T00:00:00Z'),
      };

      repository.findById.mockResolvedValueOnce(mockUser);
      repository.updateProfile.mockResolvedValueOnce(updatedUser);

      const result = await service.updateProfile('user-123', updateDto);

      expect(result).toEqual({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        updatedAt: updatedUser.updatedAt.toISOString(),
      });

      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(repository.updateProfile).toHaveBeenCalledWith('user-123', {
        name: updateDto.name,
        image: updateDto.image,
      });

      expect(auditLogsService.log).toHaveBeenCalledWith(
        {
          orgId: null,
          actorId: 'user-123',
          actorType: 'user',
        },
        {
          action: 'user.profile_updated',
          resourceType: 'user',
          resourceId: 'user-123',
          resourceName: updatedUser.name,
          changes: {
            before: { name: mockUser.name, image: mockUser.image },
            after: { name: updatedUser.name, image: updatedUser.image },
          },
        },
      );
    });

    it('should throw NotFoundException when user not found on initial check', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('user-123', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);

      expect(repository.updateProfile).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when update returns null', async () => {
      repository.findById.mockResolvedValueOnce(mockUser);
      repository.updateProfile.mockResolvedValueOnce(null);

      await expect(
        service.updateProfile('user-123', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);

      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword456',
      confirmPassword: 'newPassword456',
    };

    const mockAccount = {
      id: 'account-123',
      userId: 'user-123',
      password: 'hashedOldPassword',
      providerId: 'credential',
      accountId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      // Mock withServiceContext for account operations
      (withServiceContext as jest.Mock).mockImplementation(
        async <T>(_name: string, callback: (tx: unknown) => Promise<T>) => {
          const mockTx = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([mockAccount]),
            update: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
          };
          return callback(mockTx);
        },
      );
    });

    it('should successfully change password', async () => {
      repository.findById.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce('hashedNewPassword');

      const result = await service.changePassword('user-123', changePasswordDto);

      expect(result).toEqual({ message: 'Password changed successfully' });
      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockAccount.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(changePasswordDto.newPassword, 10);

      expect(auditLogsService.log).toHaveBeenCalledWith(
        {
          orgId: null,
          actorId: 'user-123',
          actorType: 'user',
        },
        {
          action: 'user.password_changed',
          resourceType: 'user',
          resourceId: 'user-123',
          resourceName: mockUser.name,
        },
      );
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      const mismatchDto = {
        ...changePasswordDto,
        confirmPassword: 'differentPassword',
      };

      await expect(
        service.changePassword('user-123', mismatchDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword('user-123', mismatchDto),
      ).rejects.toThrow('Passwords do not match');

      expect(repository.findById).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(NotFoundException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when account has no password', async () => {
      // First call to findById in changePassword
      repository.findById.mockResolvedValueOnce(mockUser);

      (withServiceContext as jest.Mock).mockImplementationOnce(
        async <T>(_name: string, callback: (tx: unknown) => Promise<T>) => {
          const mockTx = {
            select: jest.fn().mockReturnThis(),
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([{ ...mockAccount, password: null }]),
          };
          return callback(mockTx);
        },
      );

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when current password is incorrect', async () => {
      // First call to findById in changePassword
      repository.findById.mockResolvedValueOnce(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    const changeEmailDto = {
      newEmail: 'newemail@example.com',
    };

    beforeEach(() => {
      // Mock crypto.randomUUID
      global.crypto = {
        randomUUID: jest.fn().mockReturnValue('mock-uuid-token'),
      } as unknown as typeof globalThis.crypto;

      // Mock withServiceContext for verification insert
      (withServiceContext as jest.Mock).mockImplementation(
        async <T>(_name: string, callback: (tx: unknown) => Promise<T>) => {
          const mockTx = {
            insert: jest.fn().mockReturnThis(),
            values: jest.fn().mockResolvedValue(undefined),
          };
          return callback(mockTx);
        },
      );
    });

    it('should successfully request email change', async () => {
      repository.findById.mockResolvedValueOnce(mockUser);
      repository.findByEmail.mockResolvedValueOnce(null);

      const result = await service.changeEmail('user-123', changeEmailDto);

      expect(result).toEqual({
        message: 'Verification email sent to new address',
        newEmail: changeEmailDto.newEmail,
      });

      expect(repository.findById).toHaveBeenCalledWith('user-123');
      expect(repository.findByEmail).toHaveBeenCalledWith(changeEmailDto.newEmail);

      expect(queueService.addJob).toHaveBeenCalledWith('email', {
        to: changeEmailDto.newEmail,
        subject: 'Verify your new email address',
        template: 'email-change-verification',
        data: {
          userName: mockUser.name,
          verificationUrl: expect.stringContaining('mock-uuid-token'),
          expiresAt: expect.any(String),
        },
      });

      expect(auditLogsService.log).toHaveBeenCalledWith(
        {
          orgId: null,
          actorId: 'user-123',
          actorType: 'user',
        },
        {
          action: 'user.email_change_requested',
          resourceType: 'user',
          resourceId: 'user-123',
          resourceName: mockUser.name,
          changes: {
            before: { email: mockUser.email },
            after: { email: changeEmailDto.newEmail },
          },
        },
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findById.mockResolvedValueOnce(null);

      await expect(
        service.changeEmail('user-123', changeEmailDto),
      ).rejects.toThrow(NotFoundException);

      expect(repository.findByEmail).not.toHaveBeenCalled();
      expect(queueService.addJob).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when email is already in use', async () => {
      const existingUser = { ...mockUser, id: 'other-user-456' };
      // First call to findById in changeEmail
      repository.findById.mockResolvedValueOnce(mockUser);
      repository.findByEmail.mockResolvedValueOnce(existingUser);

      await expect(
        service.changeEmail('user-123', changeEmailDto),
      ).rejects.toThrow(BadRequestException);

      expect(queueService.addJob).not.toHaveBeenCalled();
      expect(auditLogsService.log).not.toHaveBeenCalled();
    });
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

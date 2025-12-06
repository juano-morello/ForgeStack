/**
 * Users Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Mock @forgestack/db
jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  withServiceContext: jest.fn(),
  users: {},
  accounts: {},
  verifications: {},
}));

import type { RequestWithUser } from '../core/types';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

  const mockRequest = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
    session: {
      id: 'session-123',
      userId: 'user-123',
      expiresAt: new Date(),
    },
  } as RequestWithUser;

  beforeEach(async () => {
    const mockService = {
      updateProfile: jest.fn(),
      changePassword: jest.fn(),
      changeEmail: jest.fn(),
      getOnboardingStatus: jest.fn(),
      completeOnboarding: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;

    jest.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should successfully update profile', async () => {
      const updateDto = {
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      };

      const expectedResult = {
        id: 'user-123',
        name: 'Updated Name',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
        updatedAt: '2024-01-03T00:00:00.000Z',
      };

      service.updateProfile.mockResolvedValueOnce(expectedResult);

      const result = await controller.updateProfile(updateDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.updateProfile).toHaveBeenCalledWith('user-123', updateDto);
    });

    it('should handle NotFoundException', async () => {
      const updateDto = { name: 'New Name' };
      service.updateProfile.mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(
        controller.updateProfile(updateDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const changePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      const expectedResult = { message: 'Password changed successfully' };
      service.changePassword.mockResolvedValueOnce(expectedResult);

      const result = await controller.changePassword(changePasswordDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.changePassword).toHaveBeenCalledWith('user-123', changePasswordDto);
    });

    it('should handle BadRequestException for password mismatch', async () => {
      const changePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'differentPassword',
      };

      service.changePassword.mockRejectedValueOnce(
        new BadRequestException('Passwords do not match'),
      );

      await expect(
        controller.changePassword(changePasswordDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle UnauthorizedException for incorrect current password', async () => {
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };

      service.changePassword.mockRejectedValueOnce(
        new UnauthorizedException('Current password is incorrect'),
      );

      await expect(
        controller.changePassword(changePasswordDto, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changeEmail', () => {
    it('should successfully request email change', async () => {
      const changeEmailDto = {
        newEmail: 'newemail@example.com',
      };

      const expectedResult = {
        message: 'Verification email sent to new address',
        newEmail: 'newemail@example.com',
      };

      service.changeEmail.mockResolvedValueOnce(expectedResult);

      const result = await controller.changeEmail(changeEmailDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.changeEmail).toHaveBeenCalledWith('user-123', changeEmailDto);
    });

    it('should handle BadRequestException for email already in use', async () => {
      const changeEmailDto = {
        newEmail: 'existing@example.com',
      };

      service.changeEmail.mockRejectedValueOnce(
        new BadRequestException('Email address is already in use'),
      );

      await expect(
        controller.changeEmail(changeEmailDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle NotFoundException when user not found', async () => {
      const changeEmailDto = {
        newEmail: 'newemail@example.com',
      };

      service.changeEmail.mockRejectedValueOnce(new NotFoundException('User not found'));

      await expect(
        controller.changeEmail(changeEmailDto, mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOnboardingStatus', () => {
    it('should return onboarding status when user needs onboarding', async () => {
      const expectedResult = {
        needsOnboarding: true,
        completedAt: null,
      };

      service.getOnboardingStatus.mockResolvedValueOnce(expectedResult);

      const result = await controller.getOnboardingStatus(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.getOnboardingStatus).toHaveBeenCalledWith('user-123');
    });

    it('should return onboarding status when user completed onboarding', async () => {
      const completedAt = new Date('2024-01-01T00:00:00Z');
      const expectedResult = {
        needsOnboarding: false,
        completedAt,
      };

      service.getOnboardingStatus.mockResolvedValueOnce(expectedResult);

      const result = await controller.getOnboardingStatus(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.getOnboardingStatus).toHaveBeenCalledWith('user-123');
    });

    it('should handle NotFoundException', async () => {
      service.getOnboardingStatus.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(controller.getOnboardingStatus(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('completeOnboarding', () => {
    it('should successfully complete onboarding', async () => {
      const completedAt = new Date('2024-01-01T00:00:00Z');
      const expectedResult = { completedAt };

      service.completeOnboarding.mockResolvedValueOnce(expectedResult);

      const result = await controller.completeOnboarding(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.completeOnboarding).toHaveBeenCalledWith('user-123');
    });

    it('should return existing timestamp when already completed (idempotent)', async () => {
      const completedAt = new Date('2024-01-01T00:00:00Z');
      const expectedResult = { completedAt };

      service.completeOnboarding.mockResolvedValueOnce(expectedResult);

      const result = await controller.completeOnboarding(mockRequest);

      expect(result).toEqual(expectedResult);
      expect(service.completeOnboarding).toHaveBeenCalledWith('user-123');
    });

    it('should handle NotFoundException', async () => {
      service.completeOnboarding.mockRejectedValueOnce(
        new NotFoundException('User not found'),
      );

      await expect(controller.completeOnboarding(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});


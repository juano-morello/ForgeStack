/**
 * Users Service
 * Handles business logic for user profile management
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from './users.repository';
import { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto, OnboardingStatusDto } from './dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { QueueService } from '../queue/queue.service';
import * as bcrypt from 'bcrypt';
import { eq, withServiceContext, accounts, verifications } from '@forgestack/db';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly authServerUrl: string;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {
    this.authServerUrl = this.configService.get<string>(
      'authServerUrl',
      'http://localhost:3000',
    );
  }

  /**
   * Update user profile (name and/or image)
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`Updating profile for user ${userId}`);

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const before = { name: user.name, image: user.image };
    const updated = await this.usersRepository.updateProfile(userId, {
      name: dto.name,
      image: dto.image,
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    // Log audit event (user-scoped, no orgId)
    await this.auditLogsService.log(
      {
        orgId: null as unknown as string, // User profile changes are not org-scoped
        actorId: userId,
        actorType: 'user',
      },
      {
        action: 'user.profile_updated',
        resourceType: 'user',
        resourceId: userId,
        resourceName: updated.name,
        changes: {
          before,
          after: { name: updated.name, image: updated.image },
        },
      },
    );

    this.logger.log(`Profile updated for user ${userId}`);
    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      image: updated.image,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Change user password
   * Verifies current password and updates to new password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    this.logger.log(`Changing password for user ${userId}`);

    // Validate passwords match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get the user's password hash from accounts table
    const account = await withServiceContext('UsersService.getAccount', async (tx) => {
      const [acc] = await tx
        .select()
        .from(accounts)
        .where(eq(accounts.userId, userId))
        .limit(1);
      return acc;
    });

    if (!account || !account.password) {
      throw new BadRequestException('Password authentication not configured for this user');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, account.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    // Update password in accounts table
    await withServiceContext('UsersService.updatePassword', async (tx) => {
      await tx
        .update(accounts)
        .set({ password: newPasswordHash })
        .where(eq(accounts.userId, userId));
    });

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: null as unknown as string,
        actorId: userId,
        actorType: 'user',
      },
      {
        action: 'user.password_changed',
        resourceType: 'user',
        resourceId: userId,
        resourceName: user.name,
      },
    );

    this.logger.log(`Password changed for user ${userId}`);
    return { message: 'Password changed successfully' };
  }

  /**
   * Request email change
   * Creates a verification token and sends email to new address
   */
  async changeEmail(userId: string, dto: ChangeEmailDto) {
    this.logger.log(`Requesting email change for user ${userId}`);

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if new email is already in use
    const existingUser = await this.usersRepository.findByEmail(dto.newEmail);
    if (existingUser) {
      throw new BadRequestException('Email address is already in use');
    }

    // Generate verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token
    await withServiceContext('UsersService.createVerification', async (tx) => {
      await tx.insert(verifications).values({
        id: crypto.randomUUID(),
        identifier: `email-change:${userId}`,
        value: JSON.stringify({ newEmail: dto.newEmail, token }),
        expiresAt,
      });
    });

    // Queue email to new address
    await this.queueService.addJob('email', {
      to: dto.newEmail,
      subject: 'Verify your new email address',
      template: 'email-change-verification',
      data: {
        userName: user.name,
        verificationUrl: `${this.authServerUrl}/verify-email-change?token=${token}`,
        expiresAt: expiresAt.toISOString(),
      },
    });

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: null as unknown as string,
        actorId: userId,
        actorType: 'user',
      },
      {
        action: 'user.email_change_requested',
        resourceType: 'user',
        resourceId: userId,
        resourceName: user.name,
        changes: {
          before: { email: user.email },
          after: { email: dto.newEmail },
        },
      },
    );

    this.logger.log(`Email change requested for user ${userId}`);
    return {
      message: 'Verification email sent to new address',
      newEmail: dto.newEmail,
    };
  }

  /**
   * Get onboarding status for a user
   * Returns whether the user needs to complete onboarding
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatusDto> {
    this.logger.log(`Getting onboarding status for user ${userId}`);

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      needsOnboarding: !user.onboardingCompletedAt,
      completedAt: user.onboardingCompletedAt || null,
    };
  }

  /**
   * Mark onboarding as complete for a user
   * Idempotent - calling again returns existing timestamp
   */
  async completeOnboarding(userId: string): Promise<{ completedAt: Date }> {
    this.logger.log(`Completing onboarding for user ${userId}`);

    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If already completed, return existing timestamp (idempotent)
    if (user.onboardingCompletedAt) {
      this.logger.log(`Onboarding already completed for user ${userId}`);
      return { completedAt: user.onboardingCompletedAt };
    }

    // Mark as complete
    const completedAt = new Date();
    await this.usersRepository.updateOnboardingStatus(userId, completedAt);

    // Log audit event (user-scoped, no orgId - org_id is nullable for user events)
    await this.auditLogsService.log(
      {
        orgId: null,
        actorId: userId,
        actorType: 'user',
      },
      {
        action: 'user.onboarding_completed',
        resourceType: 'user',
        resourceId: userId,
        resourceName: user.name,
      },
    );

    this.logger.log(`Onboarding completed for user ${userId}`);
    return { completedAt };
  }
}


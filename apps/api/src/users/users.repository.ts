/**
 * Users Repository
 * Handles database operations for user records
 */

import { Injectable, Logger } from '@nestjs/common';
import { eq, withServiceContext, users, type User } from '@forgestack/db';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  /**
   * Find a user by ID
   */
  async findById(userId: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${userId}`);

    return withServiceContext('UsersRepository.findById', async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      return user || null;
    });
  }

  /**
   * Find a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);

    return withServiceContext('UsersRepository.findByEmail', async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return user || null;
    });
  }

  /**
   * Update user profile fields (name, image)
   */
  async updateProfile(
    userId: string,
    data: Partial<Pick<User, 'name' | 'image'>>,
  ): Promise<User | null> {
    this.logger.debug(`Updating profile for user: ${userId}`);

    return withServiceContext('UsersRepository.updateProfile', async (tx) => {
      const [user] = await tx
        .update(users)
        .set(data)
        .where(eq(users.id, userId))
        .returning();
      return user || null;
    });
  }

  /**
   * Update onboarding status for a user
   */
  async updateOnboardingStatus(userId: string, completedAt: Date): Promise<void> {
    this.logger.debug(`Updating onboarding status for user: ${userId}`);

    await withServiceContext('UsersRepository.updateOnboardingStatus', async (tx) => {
      await tx
        .update(users)
        .set({ onboardingCompletedAt: completedAt })
        .where(eq(users.id, userId));
    });
  }
}


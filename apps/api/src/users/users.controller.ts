/**
 * Users Controller
 * REST API endpoints for user profile management
 */

import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto, ChangeEmailDto } from './dto';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import type { RequestWithUser } from '../core/types';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@NoOrgRequired() // All user endpoints require auth but not org context
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * PATCH /users/me/profile
   * Update current user's profile (name, avatar)
   */
  @Patch('me/profile')
  @ApiOperation({ summary: 'Update profile', description: "Update current user's profile (name, avatar)" })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    this.logger.log(`Updating profile for user ${userId}`);
    return this.usersService.updateProfile(userId, updateProfileDto);
  }

  /**
   * POST /users/me/change-password
   * Change user password (requires current password)
   */
  @Post('me/change-password')
  @ApiOperation({ summary: 'Change password', description: 'Change user password (requires current password)' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    this.logger.log(`Changing password for user ${userId}`);
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  /**
   * POST /users/me/change-email
   * Request email change (sends verification to new email)
   */
  @Post('me/change-email')
  @ApiOperation({ summary: 'Change email', description: 'Request email change (sends verification to new email)' })
  @ApiResponse({ status: 200, description: 'Email change request sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changeEmail(
    @Body() changeEmailDto: ChangeEmailDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    this.logger.log(`Requesting email change for user ${userId}`);
    return this.usersService.changeEmail(userId, changeEmailDto);
  }

  /**
   * GET /users/me/onboarding-status
   * Get onboarding status for current user
   */
  @Get('me/onboarding-status')
  @ApiOperation({ summary: 'Get onboarding status', description: 'Get onboarding status for current user' })
  @ApiResponse({ status: 200, description: 'Onboarding status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getOnboardingStatus(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.log(`Getting onboarding status for user ${userId}`);
    return this.usersService.getOnboardingStatus(userId);
  }

  /**
   * POST /users/me/complete-onboarding
   * Mark onboarding as complete for current user
   */
  @Post('me/complete-onboarding')
  @ApiOperation({ summary: 'Complete onboarding', description: 'Mark onboarding as complete for current user' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeOnboarding(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.log(`Completing onboarding for user ${userId}`);
    return this.usersService.completeOnboarding(userId);
  }
}


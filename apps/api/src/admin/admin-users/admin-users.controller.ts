/**
 * Admin Users Controller
 * Super-admin endpoints for user management
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Logger,
  Req,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto, SuspendUserDto, PaginatedUsersDto, UserDto } from './dto';
import { RequireSuperAdmin } from '../../core/decorators/require-super-admin.decorator';
import { NoOrgRequired } from '../../core/decorators/no-org-required.decorator';
import type { PlatformAuditContext } from '../platform-audit/platform-audit.service';
import type { RequestWithUser } from '../../core/types';
import type { User } from '@forgestack/db';

@Controller('admin/users')
@RequireSuperAdmin()
@NoOrgRequired()
export class AdminUsersController {
  private readonly logger = new Logger(AdminUsersController.name);

  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * List all users with pagination and search
   * GET /admin/users
   */
  @Get()
  async findAll(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    this.logger.log('Listing all users');
    
    const result = await this.adminUsersService.findAll({
      search: query.search,
      suspended: query.suspended,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: result.items.map(this.mapToDto),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get user details by ID
   * GET /admin/users/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserDto> {
    this.logger.log(`Getting user ${id}`);
    const user = await this.adminUsersService.findById(id);
    return this.mapToDto(user);
  }

  /**
   * Suspend a user account
   * PATCH /admin/users/:id/suspend
   */
  @Patch(':id/suspend')
  async suspend(
    @Param('id') id: string,
    @Body() dto: SuspendUserDto,
    @Req() req: RequestWithUser,
  ): Promise<UserDto> {
    this.logger.log(`Suspending user ${id}`);

    const auditContext = this.getAuditContext(req);
    const user = await this.adminUsersService.suspend(id, dto.reason, auditContext);

    return this.mapToDto(user);
  }

  /**
   * Unsuspend a user account
   * PATCH /admin/users/:id/unsuspend
   */
  @Patch(':id/unsuspend')
  async unsuspend(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<UserDto> {
    this.logger.log(`Unsuspending user ${id}`);

    const auditContext = this.getAuditContext(req);
    const user = await this.adminUsersService.unsuspend(id, auditContext);

    return this.mapToDto(user);
  }

  /**
   * Delete a user account
   * DELETE /admin/users/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting user ${id}`);

    const auditContext = this.getAuditContext(req);
    await this.adminUsersService.delete(id, auditContext);

    return { message: 'User deleted successfully' };
  }

  /**
   * Extract audit context from request
   */
  private getAuditContext(req: RequestWithUser): PlatformAuditContext {
    return {
      actorId: req.user.id,
      actorEmail: req.user.email || '',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
    };
  }

  /**
   * Map user entity to DTO
   */
  private mapToDto(user: User): UserDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      isSuperAdmin: user.isSuperAdmin,
      suspendedAt: user.suspendedAt,
      suspendedReason: user.suspendedReason,
      suspendedBy: user.suspendedBy,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}


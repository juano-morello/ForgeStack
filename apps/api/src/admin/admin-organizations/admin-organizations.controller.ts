/**
 * Admin Organizations Controller
 * Super-admin endpoints for organization management
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
import { AdminOrganizationsService } from './admin-organizations.service';
import {
  ListOrganizationsQueryDto,
  SuspendOrganizationDto,
  TransferOwnershipDto,
  PaginatedOrganizationsDto,
  OrganizationDto,
} from './dto';
import { RequireSuperAdmin } from '../../core/decorators/require-super-admin.decorator';
import { NoOrgRequired } from '../../core/decorators/no-org-required.decorator';
import type { PlatformAuditContext } from '../platform-audit/platform-audit.service';
import type { RequestWithUser } from '../../core/types';
import type { Organization } from '@forgestack/db';

@Controller('admin/organizations')
@RequireSuperAdmin()
@NoOrgRequired()
export class AdminOrganizationsController {
  private readonly logger = new Logger(AdminOrganizationsController.name);

  constructor(private readonly adminOrganizationsService: AdminOrganizationsService) {}

  /**
   * List all organizations with pagination and search
   * GET /admin/organizations
   */
  @Get()
  async findAll(@Query() query: ListOrganizationsQueryDto): Promise<PaginatedOrganizationsDto> {
    this.logger.log('Listing all organizations');
    
    const result = await this.adminOrganizationsService.findAll({
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
   * Get organization details by ID
   * GET /admin/organizations/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrganizationDto> {
    this.logger.log(`Getting organization ${id}`);
    const org = await this.adminOrganizationsService.findById(id);
    return this.mapToDto(org);
  }

  /**
   * Suspend an organization
   * PATCH /admin/organizations/:id/suspend
   */
  @Patch(':id/suspend')
  async suspend(
    @Param('id') id: string,
    @Body() dto: SuspendOrganizationDto,
    @Req() req: RequestWithUser,
  ): Promise<OrganizationDto> {
    this.logger.log(`Suspending organization ${id}`);

    const auditContext = this.getAuditContext(req);
    const org = await this.adminOrganizationsService.suspend(id, dto.reason, auditContext);

    return this.mapToDto(org);
  }

  /**
   * Unsuspend an organization
   * PATCH /admin/organizations/:id/unsuspend
   */
  @Patch(':id/unsuspend')
  async unsuspend(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<OrganizationDto> {
    this.logger.log(`Unsuspending organization ${id}`);

    const auditContext = this.getAuditContext(req);
    const org = await this.adminOrganizationsService.unsuspend(id, auditContext);

    return this.mapToDto(org);
  }

  /**
   * Transfer organization ownership
   * PATCH /admin/organizations/:id/transfer-ownership
   */
  @Patch(':id/transfer-ownership')
  async transferOwnership(
    @Param('id') id: string,
    @Body() dto: TransferOwnershipDto,
    @Req() req: RequestWithUser,
  ): Promise<OrganizationDto> {
    this.logger.log(`Transferring ownership of organization ${id}`);

    const auditContext = this.getAuditContext(req);
    const org = await this.adminOrganizationsService.transferOwnership(
      id,
      dto.newOwnerId,
      auditContext,
    );

    return this.mapToDto(org);
  }

  /**
   * Delete an organization
   * DELETE /admin/organizations/:id
   */
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    this.logger.log(`Deleting organization ${id}`);

    const auditContext = this.getAuditContext(req);
    await this.adminOrganizationsService.delete(id, auditContext);

    return { message: 'Organization deleted successfully' };
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
   * Map organization entity to DTO
   */
  private mapToDto(org: Organization): OrganizationDto {
    return {
      id: org.id,
      name: org.name,
      ownerUserId: org.ownerUserId,
      suspendedAt: org.suspendedAt,
      suspendedReason: org.suspendedReason,
      suspendedBy: org.suspendedBy,
      createdAt: org.createdAt,
    };
  }
}


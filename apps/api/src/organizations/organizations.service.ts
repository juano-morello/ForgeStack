/**
 * Organizations Service
 * Handles business logic for organization operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { type TenantContext } from '@forgestack/db';
import { CreateOrganizationDto, UpdateOrganizationDto, QueryOrganizationsDto } from './dto';
import { OrganizationsRepository, type MembershipResult } from './organizations.repository';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  /**
   * Verify membership and create tenant context
   * @throws NotFoundException if user is not a member
   * @throws ForbiddenException if requireOwner is true and user is not OWNER
   */
  private async createTenantContext(
    userId: string,
    orgId: string,
    options: { requireOwner?: boolean } = {},
  ): Promise<{ ctx: TenantContext; membership: MembershipResult }> {
    const membership = await this.organizationsRepository.findMembership(userId, orgId);
    if (!membership) {
      throw new NotFoundException('Organization not found');
    }

    if (options.requireOwner && membership.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can perform this action');
    }

    const ctx: TenantContext = {
      orgId,
      userId,
      role: membership.role,
    };

    return { ctx, membership };
  }


  /**
   * Create a new organization and add the creator as OWNER
   */
  async create(userId: string, dto: CreateOrganizationDto) {
    this.logger.log(`Creating organization "${dto.name}" for user ${userId}`);

    const result = await this.organizationsRepository.create(userId, {
      name: dto.name,
    });

    this.logger.log(`Organization created: ${result.id}`);
    return result;
  }

  /**
   * Get all organizations where the user is a member with pagination
   */
  async findAllForUser(userId: string, query: QueryOrganizationsDto) {
    this.logger.debug(`Finding all organizations for user ${userId}`);
    return this.organizationsRepository.findAllByUserId(userId, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Get a single organization by ID (verifies membership via tenant context)
   */
  async findOne(orgId: string, userId: string) {
    this.logger.debug(`Finding organization ${orgId} for user ${userId}`);

    const { ctx, membership } = await this.createTenantContext(userId, orgId);

    const result = await this.organizationsRepository.findById(ctx, orgId);
    if (!result) {
      throw new NotFoundException('Organization not found');
    }

    return { ...result, role: membership.role };
  }

  /**
   * Update an organization (OWNER only)
   */
  async update(orgId: string, userId: string, dto: UpdateOrganizationDto) {
    this.logger.log(`Updating organization ${orgId} by user ${userId}`);

    const { ctx } = await this.createTenantContext(userId, orgId, { requireOwner: true });

    // Get current state for audit log
    const before = await this.organizationsRepository.findById(ctx, orgId);
    if (!before) {
      throw new NotFoundException('Organization not found');
    }

    const result = await this.organizationsRepository.update(ctx, orgId, {
      name: dto.name,
      logo: dto.logo,
      timezone: dto.timezone,
      language: dto.language,
    });

    if (!result) {
      throw new NotFoundException('Organization not found');
    }

    // Log audit event with changes
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'organization.updated',
        resourceType: 'organization',
        resourceId: result.id,
        resourceName: result.name,
        changes: {
          before: {
            name: before.name,
            logo: before.logo,
            timezone: before.timezone,
            language: before.language,
          },
          after: {
            name: result.name,
            logo: result.logo,
            timezone: result.timezone,
            language: result.language,
          },
        },
      },
    );

    this.logger.log(`Organization ${orgId} updated`);
    return result;
  }

  /**
   * Delete an organization (OWNER only)
   */
  async remove(orgId: string, userId: string) {
    this.logger.log(`Deleting organization ${orgId} by user ${userId}`);

    const { ctx } = await this.createTenantContext(userId, orgId, { requireOwner: true });

    await this.organizationsRepository.delete(ctx, orgId);

    this.logger.log(`Organization ${orgId} deleted`);
    return { deleted: true };
  }
}


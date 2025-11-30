/**
 * Members Service
 * Handles business logic for organization member operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  type TenantContext,
  type OrgRole,
  organizations,
  eq,
  withServiceContext,
} from '@forgestack/db';
import { MembersRepository } from './members.repository';
import { UpdateMemberRoleDto, QueryMembersDto } from './dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * List all members of an organization (any member can view)
   */
  async findAll(ctx: TenantContext, query: QueryMembersDto) {
    this.logger.debug(`Finding all members for org ${ctx.orgId}`);

    return this.membersRepository.findAllByOrgId(ctx.orgId, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Update a member's role (OWNER only)
   */
  async updateRole(
    ctx: TenantContext,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    this.logger.log(
      `Updating role for member ${targetUserId} in org ${ctx.orgId} by user ${ctx.userId}`,
    );

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can update member roles');
    }

    // Verify target member exists
    const targetMember = await this.membersRepository.findByUserIdAndOrgId(
      targetUserId,
      ctx.orgId,
    );
    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // If demoting an OWNER, verify there's at least one other OWNER
    if (targetMember.role === 'OWNER' && dto.role === 'MEMBER') {
      const ownerCount = await this.membersRepository.countOwners(ctx.orgId);
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the last owner. Promote another member to owner first.',
        );
      }
    }

    // Cannot change own role if last OWNER
    if (targetUserId === ctx.userId && targetMember.role === 'OWNER') {
      const ownerCount = await this.membersRepository.countOwners(ctx.orgId);
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot change your own role as the last owner',
        );
      }
    }

    await this.membersRepository.updateRole(ctx.orgId, targetUserId, dto.role);

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'member.role_changed',
        resourceType: 'member',
        resourceId: targetUserId,
        resourceName: targetMember.name || targetMember.email,
        changes: {
          before: { role: targetMember.role },
          after: { role: dto.role },
        },
      },
    );

    this.logger.log(
      `Role updated for member ${targetUserId} in org ${ctx.orgId}`,
    );

    // Send notification to the affected member
    const org = await withServiceContext('MembersService.getOrg', async (tx) => {
      const [orgRecord] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, ctx.orgId))
        .limit(1);
      return orgRecord;
    });

    if (org) {
      await this.notificationsService.send({
        userId: targetUserId,
        orgId: ctx.orgId,
        type: 'member.role_changed',
        title: 'Role Updated',
        body: `Your role in ${org.name} has been changed to ${dto.role}`,
        link: `/organizations/${ctx.orgId}/settings`,
        metadata: {
          previousRole: targetMember.role,
          newRole: dto.role,
        },
      });
    }

    // Return updated member
    return this.membersRepository.findByUserIdAndOrgId(targetUserId, ctx.orgId);
  }

  /**
   * Remove a member from an organization (OWNER only)
   */
  async remove(ctx: TenantContext, targetUserId: string) {
    this.logger.log(
      `Removing member ${targetUserId} from org ${ctx.orgId} by user ${ctx.userId}`,
    );

    // Verify caller is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can remove members');
    }

    // Verify target member exists
    const targetMember = await this.membersRepository.findByUserIdAndOrgId(
      targetUserId,
      ctx.orgId,
    );
    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove self if last OWNER
    if (targetUserId === ctx.userId && targetMember.role === 'OWNER') {
      const ownerCount = await this.membersRepository.countOwners(ctx.orgId);
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove yourself as the last owner',
        );
      }
    }

    // Get the organization's founding owner
    const org = await this.getOrganizationOwner(ctx.orgId);
    
    // Cannot remove the founding owner
    if (targetUserId === org.ownerUserId) {
      throw new BadRequestException(
        'Cannot remove the founding owner of the organization',
      );
    }

    await this.membersRepository.delete(ctx.orgId, targetUserId);

    // Log audit event
    await this.auditLogsService.log(
      {
        orgId: ctx.orgId,
        actorId: ctx.userId,
        actorType: 'user',
      },
      {
        action: 'member.removed',
        resourceType: 'member',
        resourceId: targetUserId,
        resourceName: targetMember.name || targetMember.email,
        metadata: {
          role: targetMember.role,
        },
      },
    );

    this.logger.log(`Member ${targetUserId} removed from org ${ctx.orgId}`);
  }

  /**
   * Add a member to an organization (called from invitations service)
   */
  async addMember(orgId: string, userId: string, role: OrgRole) {
    this.logger.log(`Adding member ${userId} to org ${orgId} with role ${role}`);

    await this.membersRepository.create(orgId, userId, role);

    this.logger.log(`Member ${userId} added to org ${orgId}`);
  }

  /**
   * Get organization owner (helper method)
   */
  private async getOrganizationOwner(orgId: string) {
    return withServiceContext('MembersService.getOrganizationOwner', async (tx) => {
      const [org] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1);

      if (!org) {
        throw new NotFoundException('Organization not found');
      }

      return org;
    });
  }
}

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

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(private readonly membersRepository: MembersRepository) {}

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

    this.logger.log(
      `Role updated for member ${targetUserId} in org ${ctx.orgId}`,
    );

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

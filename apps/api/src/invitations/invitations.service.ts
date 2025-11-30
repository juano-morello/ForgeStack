/**
 * Invitations Service
 * Handles business logic for invitation operations
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  type TenantContext,
  withServiceContext,
  organizationMembers,
  organizations,
  users,
  invitations,
  eq,
  and,
} from '@forgestack/db';
import { INVITATION_VALIDATION } from '@forgestack/shared';
import { InvitationsRepository } from './invitations.repository';
import { OrganizationsRepository } from '../organizations/organizations.repository';
import { QueueService } from '../queue/queue.service';
import { ActivitiesService } from '../activities/activities.service';
import { CreateInvitationDto, QueryInvitationsDto } from './dto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly queueService: QueueService,
    private readonly activitiesService: ActivitiesService,
  ) {}

  /**
   * Create a new invitation (OWNER only)
   */
  async create(ctx: TenantContext, dto: CreateInvitationDto) {
    this.logger.log(`Creating invitation for ${dto.email} to org ${ctx.orgId}`);

    // Verify user is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can invite members');
    }

    // Check if user is already a member
    const existingMember = await withServiceContext(
      'InvitationsService.checkMembership',
      async (tx) => {
        const [user] = await tx
          .select({ id: users.id })
          .from(users)
          .where(eq(users.email, dto.email));

        if (!user) {
          return null;
        }

        const [member] = await tx
          .select()
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.userId, user.id),
              eq(organizationMembers.orgId, ctx.orgId),
            ),
          );

        return member || null;
      },
    );

    if (existingMember) {
      throw new ConflictException('User is already a member of this organization');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationsRepository.findByEmailAndOrg(
      dto.email,
      ctx.orgId,
    );

    if (existingInvitation) {
      throw new ConflictException('An invitation has already been sent to this email');
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex'); // 64 char hex string

    // Set expiry to 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_VALIDATION.EXPIRY_DAYS);

    // Create invitation
    const invitation = await this.invitationsRepository.create(
      ctx.orgId,
      dto.email,
      dto.role,
      token,
      expiresAt,
    );

    // Get organization name for email
    const org = await this.organizationsRepository.findById(ctx, ctx.orgId);
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Queue email job
    await this.queueService.addJob('send-invitation', {
      invitationId: invitation.id,
      email: invitation.email,
      orgName: org.name,
      role: invitation.role,
      token: invitation.token,
    });

    this.logger.log(`Invitation created: ${invitation.id}`);
    return invitation;
  }

  /**
   * List all pending invitations for an organization (OWNER only)
   */
  async findAllForOrg(ctx: TenantContext, query: QueryInvitationsDto) {
    this.logger.debug(`Finding invitations for org ${ctx.orgId}`);

    // Verify user is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can view invitations');
    }

    return this.invitationsRepository.findByOrgId(ctx.orgId, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * Cancel an invitation (OWNER only)
   */
  async cancel(ctx: TenantContext, invitationId: string) {
    this.logger.log(`Canceling invitation ${invitationId} for org ${ctx.orgId}`);

    // Verify user is OWNER
    if (ctx.role !== 'OWNER') {
      throw new ForbiddenException('Only owners can cancel invitations');
    }

    // Verify invitation belongs to this org
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.orgId !== ctx.orgId) {
      throw new ForbiddenException('Cannot cancel invitation from another organization');
    }

    await this.invitationsRepository.delete(invitationId);

    this.logger.log(`Invitation ${invitationId} canceled`);
    return { deleted: true };
  }

  /**
   * Accept an invitation (authenticated user)
   */
  async accept(userId: string, userEmail: string, token: string) {
    this.logger.log(`User ${userId} accepting invitation`);

    // Find invitation by token
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or expired');
    }

    // Verify not expired
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    // Verify email matches
    if (invitation.email !== userEmail) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Check if user is already a member
    const existingMember = await this.organizationsRepository.findMembership(
      userId,
      invitation.orgId,
    );

    if (existingMember) {
      // Delete invitation and return org info
      await this.invitationsRepository.delete(invitation.id);
      throw new ConflictException('You are already a member of this organization');
    }

    // Add user as member and delete invitation in a transaction
    const org = await withServiceContext('InvitationsService.accept', async (tx) => {
      // Add member
      await tx.insert(organizationMembers).values({
        orgId: invitation.orgId,
        userId: userId,
        role: invitation.role,
      });

      // Delete invitation
      await tx.delete(invitations).where(eq(invitations.id, invitation.id));

      // Get organization info
      const [organization] = await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, invitation.orgId));

      return organization;
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Create activity (async, non-blocking)
    await this.activitiesService.create({
      orgId: org.id,
      actorId: userId,
      type: 'member.joined',
      title: 'joined the organization',
    });

    this.logger.log(`User ${userId} joined org ${org.id}`);
    return { organization: org, role: invitation.role };
  }

  /**
   * Decline an invitation (no auth required)
   */
  async decline(token: string) {
    this.logger.log('Declining invitation');

    // Find invitation by token
    const invitation = await this.invitationsRepository.findByToken(token);
    if (!invitation) {
      throw new NotFoundException('Invitation not found or expired');
    }

    // Delete invitation
    await this.invitationsRepository.delete(invitation.id);

    this.logger.log(`Invitation ${invitation.id} declined`);
    return { deleted: true };
  }
}


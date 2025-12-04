/**
 * Invitations Controller
 * REST API endpoints for invitation management
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseUUIDPipe,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { type TenantContext } from '@forgestack/db';
import { InvitationsService } from './invitations.service';
import {
  CreateInvitationDto,
  AcceptInvitationDto,
  DeclineInvitationDto,
  QueryInvitationsDto,
} from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import { Public } from '../core/decorators/public.decorator';
import type { RequestWithUser } from '../core/types';

@ApiTags('Invitations')
@ApiBearerAuth()
@Controller('organizations/:orgId/invitations')
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name);

  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Create a new invitation
   * POST /organizations/:orgId/invitations
   */
  @Post()
  @ApiOperation({ summary: 'Create invitation', description: 'Create a new invitation to join the organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiResponse({ status: 201, description: 'Invitation created' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createInvitationDto: CreateInvitationDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Creating invitation for org ${ctx.orgId}`);
    return this.invitationsService.create(ctx, createInvitationDto);
  }

  /**
   * List all pending invitations for the organization
   * GET /organizations/:orgId/invitations
   */
  @Get()
  @ApiOperation({ summary: 'List invitations', description: 'List all pending invitations for the organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'accepted', 'declined'] })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  async findAll(
    @Query() query: QueryInvitationsDto,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Listing invitations for org ${ctx.orgId}`);
    return this.invitationsService.findAllForOrg(ctx, query);
  }

  /**
   * Cancel an invitation
   * DELETE /organizations/:orgId/invitations/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Cancel invitation', description: 'Cancel a pending invitation' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiParam({ name: 'id', description: 'Invitation UUID' })
  @ApiResponse({ status: 200, description: 'Invitation canceled' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() ctx: TenantContext,
  ) {
    this.logger.log(`Canceling invitation ${id} for org ${ctx.orgId}`);
    return this.invitationsService.cancel(ctx, id);
  }
}

/**
 * Public invitation endpoints (token-based)
 */
@Controller('invitations')
export class PublicInvitationsController {
  private readonly logger = new Logger(PublicInvitationsController.name);

  constructor(private readonly invitationsService: InvitationsService) {}

  /**
   * Accept an invitation
   * POST /invitations/accept
   * Requires authentication but no org context
   */
  @Post('accept')
  @NoOrgRequired()
  async accept(
    @Body() acceptInvitationDto: AcceptInvitationDto,
    @Req() request: RequestWithUser,
  ) {
    const userId = request.user.id;
    const userEmail = request.user.email;

    if (!userEmail) {
      throw new BadRequestException('User email is required');
    }

    this.logger.log(`User ${userId} accepting invitation`);
    return this.invitationsService.accept(userId, userEmail, acceptInvitationDto.token);
  }

  /**
   * Decline an invitation
   * POST /invitations/decline
   * Public endpoint (no authentication required)
   */
  @Post('decline')
  @Public()
  async decline(@Body() declineInvitationDto: DeclineInvitationDto) {
    this.logger.log('Declining invitation');
    return this.invitationsService.decline(declineInvitationDto.token);
  }
}


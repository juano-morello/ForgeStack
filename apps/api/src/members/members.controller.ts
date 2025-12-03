/**
 * Members Controller
 * REST API endpoints for organization member management
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { UpdateMemberRoleDto, QueryMembersDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { type TenantContext } from '@forgestack/db';

@ApiTags('Members')
@ApiBearerAuth()
@Controller('organizations/:orgId/members')
export class MembersController {
  private readonly logger = new Logger(MembersController.name);

  constructor(private readonly membersService: MembersService) {}

  /**
   * GET /organizations/:orgId/members
   * List all members of an organization (any member can view)
   */
  @Get()
  @ApiOperation({ summary: 'List members', description: 'List all members of an organization' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of members' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: QueryMembersDto,
  ) {
    this.logger.debug(`GET /organizations/${ctx.orgId}/members`);
    return this.membersService.findAll(ctx, query);
  }

  /**
   * PATCH /organizations/:orgId/members/:userId
   * Update a member's role (OWNER only)
   */
  @Patch(':userId')
  @ApiOperation({ summary: 'Update member role', description: "Update a member's role (OWNER only)" })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateRole(
    @CurrentTenant() ctx: TenantContext,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    this.logger.debug(
      `PATCH /organizations/${ctx.orgId}/members/${userId}`,
    );
    return this.membersService.updateRole(ctx, userId, dto);
  }

  /**
   * DELETE /organizations/:orgId/members/:userId
   * Remove a member from an organization (OWNER only)
   */
  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove member', description: 'Remove a member from an organization (OWNER only)' })
  @ApiParam({ name: 'orgId', description: 'Organization UUID' })
  @ApiParam({ name: 'userId', description: 'User UUID' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Forbidden - OWNER role required' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async remove(
    @CurrentTenant() ctx: TenantContext,
    @Param('userId') userId: string,
  ) {
    this.logger.debug(
      `DELETE /organizations/${ctx.orgId}/members/${userId}`,
    );
    await this.membersService.remove(ctx, userId);
  }
}


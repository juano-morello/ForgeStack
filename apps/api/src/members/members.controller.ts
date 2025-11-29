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
import { MembersService } from './members.service';
import { UpdateMemberRoleDto, QueryMembersDto } from './dto';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import { type TenantContext } from '@forgestack/db';

@Controller('organizations/:orgId/members')
export class MembersController {
  private readonly logger = new Logger(MembersController.name);

  constructor(private readonly membersService: MembersService) {}

  /**
   * GET /organizations/:orgId/members
   * List all members of an organization (any member can view)
   */
  @Get()
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

